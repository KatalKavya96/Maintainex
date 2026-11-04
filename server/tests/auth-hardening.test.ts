import assert from "node:assert/strict";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import express from "express";
import { errorMiddleware } from "../src/middlewares/error.middleware";
import { requireAuth, requireMember } from "../src/middlewares/auth.middleware";
import { AuthService } from "../src/modules/auth/auth.service";
import { issueSession, MAX_SESSION_AGE_SECONDS, sessionClaims, sessionVersions } from "../src/modules/auth/session";
import { AuthThrottle } from "../src/modules/auth/throttle";
import { updateProfileSchema } from "../src/modules/profile/profile.validation";
import { createPinSchema } from "../src/modules/pin/pin.validation";
import { lenientWebUrl, webUrl } from "../src/utils/webUrl";

const member = { id: "member", name: "Member", username: "member", email: "member@example.test", role: "VIEWER" as const };

test("only http(s) links without embedded credentials are accepted", () => {
  for (const bad of ["javascript:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "https://user:pass@example.test", "//example.test", "not a url"]) {
    assert.equal(webUrl.safeParse(bad).success, false, bad);
  }
  assert.equal(webUrl.safeParse("https://github.com/acme/widgets/pull/12").success, true);
  assert.equal(lenientWebUrl.parse("github.com/acme"), "https://github.com/acme");
  assert.equal(lenientWebUrl.safeParse("javascript:alert(1)").success, false);
  assert.equal(updateProfileSchema.safeParse({ body: { linkedinUrl: "javascript:fetch(1)" } }).success, false);
  assert.equal(createPinSchema.safeParse({ body: { title: "x", url: "data:text/html,hi", category: "OTHER" } }).success, false);
});

function memoryThrottle() {
  const rows = new Map<string, any>();
  const db: any = { authThrottle: {
    findMany: async ({ where }: any) => where.key.in.map((key: string) => rows.get(key)).filter(Boolean),
    findUnique: async ({ where }: any) => rows.get(where.key) ?? null,
    upsert: async ({ where, update, create }: any) => { rows.set(where.key, { ...(rows.get(where.key) ?? create), ...(rows.has(where.key) ? update : {}), key: where.key }); },
    deleteMany: async ({ where }: any) => { rows.delete(where.key); }
  } };
  return new AuthThrottle(db);
}

async function loginService() {
  const passwordHash = await bcrypt.hash("Correct-Horse-9!", 4);
  const users = [{ ...member, passwordHash, passwordSetAt: new Date(), emailVerifiedAt: null, sessionVersion: 0 }];
  const repo: any = { findByEmail: async (email: string) => users.find((u) => u.email === email) ?? null };
  return new AuthService(repo, {} as any, (async () => { throw new Error("unused"); }) as any, memoryThrottle());
}

test("unknown emails and wrong passwords get the same answer", async () => {
  const service = await loginService();
  const unknown = await service.login({ email: "nobody@example.test", password: "x" }, "10.0.0.1").catch((error) => error);
  const wrong = await service.login({ email: "member@example.test", password: "x" }, "10.0.0.2").catch((error) => error);
  assert.equal(unknown.statusCode, 401);
  assert.equal(unknown.message, wrong.message);
  assert.doesNotMatch(unknown.message, /no .*account|not registered|exists/i);
});

test("repeated wrong passwords are locked out, and the right one still works elsewhere", async () => {
  const service = await loginService();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(service.login({ email: "member@example.test", password: `guess-${attempt}` }, "10.0.0.9"), /incorrect/);
  }
  await assert.rejects(service.login({ email: "member@example.test", password: "Correct-Horse-9!" }, "10.0.0.9"), (error: any) => error.statusCode === 429);
  const ok = await service.login({ email: "member@example.test", password: "Correct-Horse-9!" }, "10.0.0.10");
  assert.equal(ok.user.id, "member");
});

test("sessions can be revoked, viewer mode is read-only, and the directory is members-only", async (t) => {
  const app = express();
  app.use(express.json());
  app.all("/private", requireAuth, (_req, res) => res.json({ ok: true }));
  app.get("/people", requireAuth, requireMember, (_req, res) => res.json({ ok: true }));
  app.use(errorMiddleware);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const original = sessionVersions.lookup;
  t.after(() => { sessionVersions.lookup = original; return new Promise<void>((resolve) => server.close(() => resolve())); });
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const call = (path: string, token: string, method = "GET") => fetch(`${base}${path}`, { method, headers: { Authorization: `Bearer ${token}` } }).then((r) => r.status);

  let current = 0;
  sessionVersions.lookup = async () => current;
  const token = issueSession({ ...member, sessionVersion: 0 });
  assert.equal(await call("/private", token), 200);
  current = 1;
  assert.equal(await call("/private", token), 401);
  sessionVersions.lookup = async () => null;
  assert.equal(await call("/private", issueSession({ ...member, sessionVersion: 0 })), 401);

  const viewer = issueSession({ id: "viewer", name: "Viewer", username: "viewer", email: "viewer@maintainex.local", role: "VIEWER" });
  assert.equal(await call("/private", viewer), 200);
  assert.equal(await call("/private", viewer, "POST"), 403);
  assert.equal(await call("/people", viewer), 403);
});

test("renewal keeps the original sign-in time and stops after the maximum session age", async () => {
  const users: any[] = [{ ...member, passwordHash: "", passwordSetAt: null, emailVerifiedAt: null, sessionVersion: 3 }];
  const service = new AuthService({ findById: async () => users[0] } as any, {} as any, (async () => null) as any, memoryThrottle());
  const signedIn = Math.floor(Date.now() / 1000) - 3600;
  const renewed = await service.me(member, { sessionVersion: 3, authTime: signedIn });
  assert.deepEqual(sessionClaims(renewed.token), { sessionVersion: 3, authTime: signedIn });
  await assert.rejects(service.me(member, { sessionVersion: 3, authTime: signedIn - MAX_SESSION_AGE_SECONDS }), /sign in again/);
});
