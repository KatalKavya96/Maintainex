import type { Request, Response } from "express";
import { env } from "../../config/env";
import { ApiResponse } from "../../utils/ApiResponse";
import { GitHubService } from "./github.service";

export class GitHubController {
  constructor(private service = new GitHubService()) {}

  status = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.status(req.user!.id)));
  };

  oauthUrl = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.oauthUrl(req.user!.id)));
  };

  callback = async (req: Request, res: Response) => {
    const data = await this.service.oauthCallback(String(req.query.code), String(req.query.state));
    const target = (env.clientUrls[0] ?? "http://localhost:3000").replace(/\/$/, "");
    res.redirect(`${target}/settings?github=connected&login=${encodeURIComponent(data.login)}`);
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
}
