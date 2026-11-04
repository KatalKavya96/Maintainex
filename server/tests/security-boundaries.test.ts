import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import { env } from "../src/config/env";
import { sessionSecret } from "../src/config/session-secret";
import { verifySession } from "../src/modules/auth/session";
import { ProfileService } from "../src/modules/profile/profile.service";
import { errorMiddleware } from "../src/middlewares/error.middleware";

const identity = { id: "owner", name: "Owner", username: "owner", email: "owner@fixture.invalid", role: "ADMIN" };
test("signing configuration rejects missing, short and known default keys", () => {
  for (const key of [undefined, "", "short", "dev-only-maintainex-secret-change-me"]) {
    assert.throws(() => sessionSecret(key), /JWT_SECRET/);
  }
  assert.equal(sessionSecret("isolated-fixture-material-with-32-bytes"), "isolated-fixture-material-with-32-bytes");
});
test("session verification rejects spoofed, expired, wrong-algorithm and incomplete identities", () => {
  assert.deepEqual(verifySession(jwt.sign(identity, env.jwtSecret, { expiresIn: "1h" })), identity);
  for (const token of [undefined, "owner", jwt.sign(identity, "unrelated-key"),
    jwt.sign(identity, env.jwtSecret, { expiresIn: -1 }),
    jwt.sign(identity, env.jwtSecret, { algorithm: "HS384", expiresIn: "1h" }),
    jwt.sign({ id: "owner" }, env.jwtSecret, { expiresIn: "1h" }),
    jwt.sign(identity, env.jwtSecret)]) {
    assert.throws(() => verifySession(token));
  }
});

function repositoryFixture() {
  const user = { ...identity, emailVerifiedAt: new Date(), usernameUpdatedAt: new Date(),
    bio: "Shared bio", githubUrl: null, linkedinUrl: null, xUrl: null, leetcodeUrl: null,
    portfolioUrl: null, skills: [], mainOrganizations: [], createdAt: new Date() };
  const calls: string[] = [];
  const repo = {
    findUser: async () => user, findUserByUsername: async () => user,
    followCounts: async () => [2, 3], isFollowing: async () => null,
    activities: async () => { calls.push("activities"); return [{ id: "private-activity", date: new Date(), notes: "Private note" }]; },
    favoritePins: async () => { calls.push("pins"); return [{ id: "private-pin" }]; },
    upcomingWork: async () => { calls.push("work"); return [{ id: "private-work", context: "Private context" }]; },
    counts: async () => { calls.push("counts"); return [1, 2, 3, 4, 5]; }
  };
  return { service: new ProfileService(repo as any), calls };
}
test("foreign and anonymous profiles never query or return private workspace content", async () => {
  const { service, calls } = repositoryFixture();
  for (const result of [await service.getProfile("owner", "other"), await service.getProfileByUsername("owner")]) {
    assert.equal(result.workspaceVisible, false);
    assert.equal("email" in result.user, false);
    assert.equal("emailVerifiedAt" in result.user, false);
    assert.equal("usernameUpdatedAt" in result.user, false);
    assert.deepEqual(result.activities, []);
    assert.deepEqual(result.favoritePins, []);
    assert.deepEqual(result.upcomingWork, []);
    assert.equal(result.stats.activities, null);
    assert.equal(result.stats.followers, 2);
  }
  assert.deepEqual(calls, []);
});
test("owners retain private email, activity notes, pins and work", async () => {
  const { service, calls } = repositoryFixture();
  const result = await service.getProfile("owner", "owner");
  assert.equal(result.workspaceVisible, true);
  assert.equal((result.user as any).email, identity.email);
  assert.equal(result.activities[0].notes, "Private note");
  assert.equal(result.upcomingWork[0].context, "Private context");
  assert.deepEqual(calls.sort(), ["activities", "counts", "pins", "work"]);
});
test("unexpected failures cannot expose connection strings through HTTP responses", () => {
  let status = 0; let body: unknown;
  const response = { status(code: number) { status = code; return this; }, json(value: unknown) { body = value; } };
  errorMiddleware(new Error("private database diagnostic"), {} as any, response as any, () => {});
  assert.equal(status, 500);
  assert.equal(JSON.stringify(body).includes("private database diagnostic"), false);
});
