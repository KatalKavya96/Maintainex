import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { env } from "../../config/env";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuthService } from "../auth/auth.service";
import { GitHubService } from "./github.service";

export class GitHubController {
  constructor(
    private service = new GitHubService(),
    private authService = new AuthService()
  ) {}

  status = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.status(req.user!.id)));
  };

  oauthUrl = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.oauthUrl(req.user!.id)));
  };

  callback = async (req: Request, res: Response) => {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    const decoded = this.decodeState(state);
    if (decoded?.purpose === "auth-oauth" && decoded.provider === "github") {
      try {
        const data = await this.authService.oauthCallback("github", code, state);
        res.redirect(`${env.clientAppUrl}/login?oauthCode=${encodeURIComponent(data.code)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "GitHub login failed.";
        res.redirect(`${env.clientAppUrl}/login?oauthError=${encodeURIComponent(message)}`);
      }
      return;
    }

    const data = await this.service.oauthCallback(code, state);
    res.redirect(`${env.clientAppUrl}/settings?github=connected&login=${encodeURIComponent(data.login)}`);
  };

  sync = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.sync(req.user!.id, req.body)));
  };

  disconnect = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.disconnect(req.user!.id)));
  };

  webhook = async (req: Request, res: Response) => {
    const data = await this.service.handleWebhook(req.headers, (req as Request & { rawBody?: Buffer }).rawBody, req.body);
    res.json(new ApiResponse(data));
  };

  private decodeState(state: string) {
    try {
      return jwt.verify(state, env.jwtSecret) as { purpose?: string; provider?: string };
    } catch {
      return null;
    }
  }
}
