import type { Request, Response } from "express";
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

  me = async (req: Request, res: Response) => {
    const data = await this.service.me(req.user!);
    res.json(new ApiResponse(data, "Session refreshed"));
  };

  viewer = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(this.service.viewer(), "Viewer session created"));
  };
}
