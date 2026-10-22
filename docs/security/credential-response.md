# Credential incident response

Rotate exposed credentials before relying on repository cleanup. Removing a file from the latest commit does not remove old Git objects, clones, forks or cached copies.

## Repository safeguards

Real `.env` files are private configuration and must never be tracked. Keep documented placeholders in `.env.example`. The local hook at `.githooks/pre-commit` checks staged content; `npm run check:secrets` scans current tracked files. CI runs both the scanner and its regression tests. The scanner reports locations and rule names, never secret values. It detects specific common patterns and tracked private-file paths; it is not a comprehensive secret-management or historical-scanning service.

Activate the local hook after cloning:

```sh
git config core.hooksPath .githooks
```

## Database and encryption rotation

The explicit maintenance script requires the endpoint identifier from the affected Neon project. Its default mode is read-only:

```sh
node server/scripts/rotate-local-credentials.mjs --expected-endpoint ENDPOINT_ID
```

Adding `--execute` changes the affected database role password, re-encrypts stored v1 credentials, rotates the local session-signing key, updates the ignored `server/.env`, and verifies new and retired database logins. Stop local API processes before executing. The operation terminates existing database sessions for the affected role. Other applications sharing the credential need updated deployment configuration.

A mode-0600 ignored `.env.rotation.pending` file is written before changes, so new credentials remain recoverable if the process stops between database commit and local-file replacement. On failure, inspect the structured status and the private recovery file locally. Never print either environment file or paste its contents into chat, tickets or build logs. A committed transaction must not be blindly rerun using the old local database URL.

Database password changes are branch-scoped. Inspect other branches or deployments that may share the old password. Updating deployment environment variables does not itself update an existing deployment; redeploy and validate it.

Re-encryption protects subsequent storage. It does not revoke access tokens that someone may already have copied. Review and revoke affected provider grants/tokens as appropriate, then reconnect accounts.

For an explicitly authorized incident, `node server/scripts/revoke-exposed-github-tokens.mjs` reports only record/token counts. Adding `--execute` revokes each known token through the owning GitHub OAuth application, removes the corresponding integration records and clears stored provider tokens. Provider identity mappings and contribution records remain intact. Accounts must reconnect afterward. Do not run this during ordinary maintenance or treat re-encryption as permission to revoke connections.

## 2026-10-22 response record

- Removed the tracked `server/.env` from the current repository revision and published secret checks, staged-content hook and regression tests in commit `7df818e90286625cd1e97d50c517dbbc8392bea3`.
- Rotated the affected Neon role password; verified a fresh connection with the replacement and rejection of the retired password.
- Re-encrypted three stored credential fields and rotated the local session-signing key.
- With explicit account-holder approval, revoked or confirmed invalid two unique GitHub tokens, disconnected two integration records and cleared one provider account's stored credentials. Contribution records and provider identity mapping were preserved.
- Updated Vercel database configuration for production/preview, token-encryption configuration for production, and session-signing configuration for production/preview. Production deployment `dpl_HeLK1rs8TVfiuShzrNqwTnYkwKLH` of the security commit reached READY and received the production alias. Verified `/api/health` returned 200 and a database-backed lookup for a random nonexistent account returned the expected 404 without creating records. Preview was not separately redeployed or verified.
- GitHub OAuth client-secret replacement still requires the account holder's sensitive browser action; the existing app secret has not yet been retired.
- Historical Git objects have not been rewritten. Other Neon branches have not been inspected. This response does not establish whether third parties accessed the exposed credentials.

## OAuth application secret

In GitHub developer settings, generate a replacement OAuth client secret, update local and deployment secret stores, verify the connection flow, and delete the exposed client secret. Credential-reset interactions in the browser require the human account holder to complete the sensitive action. Keep secret values out of screenshots and messages.

## History cleanup

After rotation and a clean-tip commit, coordinate history rewriting across branches/tags and collaborator clones. A force push is a separate operation that can invalidate existing work. Do not claim that a clean current scan means historical exposures were removed. Follow GitHub's sensitive-data-removal instructions and consider cached copies/forks.
