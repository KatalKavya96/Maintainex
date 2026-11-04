import type { Request, Response } from "express";
import { apiBaseFor } from "../../config/origins";
import { ApiResponse } from "../../utils/ApiResponse";
import { AuthService } from "./auth.service";
import { clientIp } from "./throttle";
import type { OAuthProvider } from "./oauth-handoff";

export class AuthController {
  constructor(private service = new AuthService()) {}

  signup = async (req: Request, res: Response) => {
    const data = await this.service.signup(req.body, clientIp(req));
    res.status(201).json(new ApiResponse(data, "Signup successful"));
  };

  login = async (req: Request, res: Response) => {
    const data = await this.service.login(req.body, clientIp(req));
    res.json(new ApiResponse(data, "Login successful"));
  };

  providers = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(this.service.providers()));
  };

  oauthUrl = async (req: Request, res: Response) => {
    const data = this.service.oauthStart(req.params.provider as OAuthProvider, { nonce: req.query.nonce, origin: req.query.origin, apiBase: apiBaseFor(req) });
    res.json(new ApiResponse(data));
  };

  oauthSession = async (req: Request, res: Response) => {
    const data = await this.service.oauthSession(req.body.code, req.body.nonce);
    res.json(new ApiResponse(data, "OAuth login successful"));
  };

  me = async (req: Request, res: Response) => {
    const data = await this.service.me(req.user!, req.session);
    res.json(new ApiResponse(data, "Session refreshed"));
  };

  viewer = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.startViewer(clientIp(req)), "Viewer session created"));
  };

  logoutEverywhere = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.logoutEverywhere(req.user!.id), "Signed out on every device"));
  };
}
