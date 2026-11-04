import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { env } from "../src/config/env";
import { AuthService } from "../src/modules/auth/auth.service";
import { OAuthAccounts } from "../src/modules/auth/oauth-accounts";
import { oauthCallback } from "../src/modules/auth/oauth-callback";
import { nonceHashFor, providerErrorMessage, readHandoff, signHandoff, signState } from "../src/modules/auth/oauth-handoff";
import type { OAuthProfile } from "../src/modules/auth/oauth-providers";

const nonce = "browser-tab-nonce-0123456789abcdef";
const otherNonce = "another-browser-nonce-0123456789ab";

function accountsFixture(users: any[] = [], links: { account?: any[]; githubOwner?: Record<string, string> } = {}) {
  const accounts = [...(links.account ?? [])];
  const writes: string[] = [];
  const repo: any = {
    countUsers: async () => users.length,
    findByEmail: async (email: string) => users.find((u) => u.email === email) ?? null,
    findById: async (id: string) => users.find((u) => u.id === id) ?? null,
    findByUsername: async (username: string) => users.find((u) => u.username === username) ?? null,
    create: async (data: any) => { const user = { id: `user-${users.length + 1}`, emailVerifiedAt: null, avatarUrl: null, ...data }; users.push(user); writes.push("create"); return user; },
    updateUser: async (id: string, data: any) => { Object.assign(users.find((u) => u.id === id), data); writes.push("updateUser"); },
    findAccount: async (provider: string, id: string) => accounts.find((a) => a.provider === provider && a.providerAccountId === id) ?? null,
    findUserAccount: async (userId: string, provider: string) => accounts.find((a) => a.userId === userId && a.provider === provider) ?? null,
    findUserIdByGithubId: async (id: string) => links.githubOwner?.[id] ?? accounts.find((a) => a.provider === "GITHUB" && a.providerAccountId === id)?.userId ?? null,
    upsertAccount: async (userId: string, data: any) => { accounts.push({ userId, ...data }); writes.push("account"); },
    upsertGithubIntegration: async () => { writes.push("integration"); }
  };
  return { repo, users, accounts, writes };
}

const githubProfile = (overrides: Partial<OAuthProfile> = {}): OAuthProfile => ({
  provider: "GITHUB", providerAccountId: "4242", email: "owner@example.test", emailVerified: true, name: "Owner", usernameSeed: "owner-gh",
  accessToken: "gho_fixture", rawProfile: {}, githubLogin: "owner-gh", ...overrides
});

test("handoff codes only work in the browser tab that started sign-in", () => {
  const code = signHandoff({ purpose: "oauth-session", nonceHash: nonceHashFor(nonce), userId: "u1" });
  assert.equal(readHandoff(code, nonce, "oauth-session").userId, "u1");
  assert.throws(() => readHandoff(code, otherNonce, "oauth-session"), /different browser/);
  assert.throws(() => readHandoff(code, undefined, "oauth-session"), /different browser/);
  assert.throws(() => readHandoff(code, nonce, "github-connect"), /different browser/);
  assert.throws(() => readHandoff("tampered", nonce, "oauth-session"), /expired/);
  assert.throws(() => nonceHashFor("short"), /could not start/);
});

test("provider cancellations and errors become readable messages", () => {
  assert.match(providerErrorMessage("github", { error: "access_denied" })!, /cancelled/);
  assert.match(providerErrorMessage("google", { error: "redirect_uri_mismatch" })!, /misconfigured/);
  assert.match(providerErrorMessage("github", {})!, /did not return/);
  assert.equal(providerErrorMessage("github", { code: "abc" }), null);
});

test("an unverified password account cannot be claimed through a provider with the same email", async () => {
  const { repo, writes } = accountsFixture([{ id: "squatter", email: "owner@example.test", passwordSetAt: new Date(), emailVerifiedAt: null, username: "x" }]);
  await assert.rejects(new OAuthAccounts(repo).resolveLogin(githubProfile()), /Sign in with your password/);
  assert.deepEqual(writes, []);
});

test("a verified or provider-only account with the same email is linked, not duplicated", async () => {
  const { repo, users, writes } = accountsFixture([{ id: "owner", email: "owner@example.test", passwordSetAt: new Date(), emailVerifiedAt: new Date(), username: "owner" }]);
  const user = await new OAuthAccounts(repo).resolveLogin(githubProfile());
  assert.equal(user.id, "owner");
  assert.equal(users.length, 1);
  assert.ok(writes.includes("account") && writes.includes("integration"));
});

test("a GitHub identity connected from Settings signs in to that account even with a different email", async () => {
  const { repo, users } = accountsFixture([{ id: "connected", email: "work@example.test", passwordSetAt: new Date(), emailVerifiedAt: null, username: "w" }], { githubOwner: { "4242": "connected" } });
  const user = await new OAuthAccounts(repo).resolveLogin(githubProfile({ email: "personal@example.test" }));
  assert.equal(user.id, "connected");
  assert.equal(users.length, 1);
});

test("new provider users are verified, and never ADMIN while an invitation code is configured", async (t) => {
  const previous = env.signupAdminCode;
  t.after(() => { env.signupAdminCode = previous; });
  env.signupAdminCode = undefined;
  const open = await new OAuthAccounts(accountsFixture().repo).resolveLogin(githubProfile({ provider: "GOOGLE", providerAccountId: "g-1" }));
  assert.ok(open.emailVerifiedAt);
  assert.equal(open.role, "ADMIN");
  env.signupAdminCode = "private-invitation";
  const invited = await new OAuthAccounts(accountsFixture().repo).resolveLogin(githubProfile({ provider: "GOOGLE", providerAccountId: "g-2" }));
  assert.equal(invited.role, "VIEWER");
  await assert.rejects(new OAuthAccounts(accountsFixture().repo).resolveLogin(githubProfile({ emailVerified: false })), /did not confirm/);
});

test("connecting a GitHub account already owned by someone else is refused", async () => {
  const { repo } = accountsFixture([], { githubOwner: { "4242": "someone-else" } });
  await assert.rejects(new OAuthAccounts(repo).connectGithub("me", { githubUserId: "4242", login: "gh", accessToken: "t" }), /already connected to another/);
});

test("callbacks always redirect back to the app, including cancellation and forged state", async (t) => {
  const exchanged: string[] = [];
  const auth = new AuthService(accountsFixture().repo, { resolveLogin: async () => ({ id: "u1" }) } as any, async (_p, code) => { exchanged.push(code); return githubProfile(); });
  const app = express();
  app.get("/cb", oauthCallback("github", auth, {} as any));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/cb`;
  const state = signState({ purpose: "auth-oauth", provider: "github", nonceHash: nonceHashFor(nonce), origin: "http://localhost:3000" });
  const go = async (query: string) => (await fetch(`${base}?${query}`, { redirect: "manual" })).headers.get("location") ?? "";

  assert.match(await go(`state=${state}&error=access_denied`), /^http:\/\/localhost:3000\/login\?oauthError=GitHub%20access%20was%20cancelled/);
  assert.match(await go(`state=forged&code=abc`), /oauthError=This%20sign-in%20link%20expired/);
  const success = await go(`state=${state}&code=abc`);
  assert.match(success, /^http:\/\/localhost:3000\/login\?oauthCode=/);
  assert.deepEqual(exchanged, ["abc"]);
  const handoff = decodeURIComponent(new URL(success).searchParams.get("oauthCode")!);
  assert.equal(readHandoff(handoff, nonce, "oauth-session").userId, "u1");
});
