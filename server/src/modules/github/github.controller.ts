import type { Request, Response } from "express";
import { apiBaseFor } from "../../config/origins";
import { ApiResponse } from "../../utils/ApiResponse";
import { GitHubService } from "./github.service";

export class GitHubController {
  constructor(private service = new GitHubService()) {}

  status = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.status(req.user!)));
  };

  oauthUrl = async (req: Request, res: Response) => {
    res.json(new ApiResponse(this.service.connectStart(req.user!.id, { nonce: req.query.nonce, origin: req.query.origin, apiBase: apiBaseFor(req) })));
  };

  connect = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.connectFinish(req.user!.id, req.body.code, req.body.nonce), "GitHub connected"));
  };

  preferences = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.updatePreferences(req.user!.id, req.body), "Sync settings saved"));
  };

  sync = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.sync(req.user!.id, req.body ?? {})));
  };

  scheduledSync = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.syncScheduled()));
  };

  disconnect = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.disconnect(req.user!.id, { removeImported: req.query.removeImported === "true" })));
  };

  webhook = async (req: Request, res: Response) => {
    const data = await this.service.handleWebhook(req.headers, (req as Request & { rawBody?: Buffer }).rawBody, req.body);
    res.json(new ApiResponse(data));
  };
}
