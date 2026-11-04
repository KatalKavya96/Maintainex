import type { Request, Response } from "express";
import { env } from "../../config/env";
import { apiBaseFor } from "../../config/origins";
import { ApiError } from "../../utils/ApiError";
import { GitHubService } from "../github/github.service";
import { AuthService } from "./auth.service";
import { providerErrorMessage, readState, type OAuthProvider } from "./oauth-handoff";

const withParam = (base: string, key: string, value: string) => `${base}${base.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;

/**
 * Every provider redirect lands here and always ends in a redirect back to the app, never a raw API error page.
 * GitHub OAuth apps register one callback URL, so sign-in and Settings → Connect share it, told apart by the signed state.
 */
export function oauthCallback(routeProvider: OAuthProvider, auth = new AuthService(), github = new GitHubService()) {
  return async (req: Request, res: Response) => {
    const state = readState(req.query.state);
    const origin = state?.origin ?? env.clientAppUrl;
    const connecting = state?.purpose === "github-oauth";
    const fail = (message: string) =>
      res.redirect(connecting ? withParam(`${origin}/settings`, "githubError", message) : withParam(`${origin}/login`, "oauthError", message));

    if (!state) return fail("This sign-in link expired or was already used. Please start again.");
    if (state.provider !== routeProvider) return fail("Sign-in returned from the wrong provider. Please start again.");
    const providerError = providerErrorMessage(routeProvider, req.query as Record<string, unknown>);
    if (providerError) return fail(providerError);

    try {
      const code = String(req.query.code);
      const apiBase = apiBaseFor(req);
      if (connecting) return res.redirect(withParam(`${origin}/settings`, "githubHandoff", await github.connectComplete(state, code, apiBase)));
      return res.redirect(withParam(`${origin}/login`, "oauthCode", await auth.oauthComplete(state, code, apiBase)));
    } catch (error) {
      return fail(error instanceof ApiError ? error.message : "Sign-in could not be completed. Please try again.");
    }
  };
}
