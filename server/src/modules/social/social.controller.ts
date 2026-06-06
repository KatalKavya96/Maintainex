import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { SocialService } from "./social.service";

export class SocialController {
  constructor(private service = new SocialService()) {}

  follow = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.follow(req.user!.id, req.params.userId)));
  };

  unfollow = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.unfollow(req.user!.id, req.params.userId)));
  };

  followers = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.followers(req.params.username)));
  };

  following = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.following(req.params.username)));
  };

  feed = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.feed(req.user!.id, req.query as Record<string, string | undefined>)));
  };

  leaderboard = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.leaderboard(req.query as Record<string, string | undefined>)));
  };

  badges = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.badges(req.params.username)));
  };

  compare = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.compare(req.user!.id, req.params.username)));
  };

  notifications = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.notifications(req.user!.id)));
  };

  markNotificationRead = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.markNotificationRead(req.user!.id, req.params.id)));
  };
}
