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

  usernameAvailability = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.usernameAvailability(req.user!.id, String(req.query.username ?? ""))));
  };

  updateMe = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.updateCurrentProfile(req.user!.id, req.body), "Profile updated"));
  };

  changePassword = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword), "Password changed"));
  };

  sendEmailVerification = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.sendEmailVerificationOtp(req.user!.id), "Verification code sent"));
  };

  verifyEmail = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.verifyEmailOtp(req.user!.id, req.body.code), "Email verified"));
  };

  resetWorkspace = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.resetWorkspace(req.user!.id, req.body?.password), "Workspace data reset"));
  };
}
