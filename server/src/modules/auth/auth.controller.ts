import type { Request, Response } from "express";
import { env } from "../../config/env";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuthService } from "./auth.service";

export class AuthController {
  constructor(private service = new AuthService()) {}

  signup = async (req: Request, res: Response) => {
    const data = await this.service.signup(req.body);
    res.status(201).json(new ApiResponse(data, "Signup successful"));
  };

  login = async (req: Request, res: Response) => {
    const data = await this.service.login(req.body);
    res.json(new ApiResponse(data, "Login successful"));
  };

  oauthUrl = async (req: Request, res: Response) => {
    res.json(new ApiResponse(this.service.oauthUrl(req.params.provider as "google" | "github")));
  };

  oauthCallback = async (req: Request, res: Response) => {
    try {
      const data = await this.service.oauthCallback(req.params.provider as "google" | "github", String(req.query.code), String(req.query.state));
      const target = `${this.clientUrl()}/login?oauthCode=${encodeURIComponent(data.code)}`;
      res.redirect(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OAuth login failed.";
      res.redirect(`${this.clientUrl()}/login?oauthError=${encodeURIComponent(message)}`);
    }
  };

  oauthSession = async (req: Request, res: Response) => {
    const data = await this.service.oauthSession(req.body.code);
    res.json(new ApiResponse(data, "OAuth login successful"));
  };

  me = async (req: Request, res: Response) => {
    const data = await this.service.me(req.user!);
    res.json(new ApiResponse(data, "Session refreshed"));
  };

  viewer = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(this.service.viewer(), "Viewer session created"));
  };

  private clientUrl() {
    return env.clientAppUrl;
  }
}
