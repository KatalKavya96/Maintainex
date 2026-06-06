import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { ProfileService } from "./profile.service";

export class ProfileController {
  constructor(private service = new ProfileService()) {}

  list = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.list()));
  };

  get = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.getProfile(req.params.userId, req.user?.id)));
  };

  getByUsername = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.getProfileByUsername(req.params.username, req.user?.id)));
  };
}
