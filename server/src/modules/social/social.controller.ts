import type { Request, Response } from "express";
import type { ActivityReactionType } from "@prisma/client";
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

  engagement = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.engagement(req.user!.id, req.params.activityId)));
  };

  react = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.react(req.user!.id, req.params.activityId, req.body.type)));
  };

  unreact = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.unreact(req.user!.id, req.params.activityId, req.params.type as ActivityReactionType)));
  };

  comments = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.comments(req.user!.id, req.params.activityId)));
  };

  comment = async (req: Request, res: Response) => {
    res.status(201).json(new ApiResponse(await this.service.comment(req.user!.id, req.params.activityId, req.body.body), "Comment added"));
  };

  deleteComment = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.deleteComment(req.user!.id, req.params.activityId, req.params.commentId), "Comment deleted"));
  };

  bookmark = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.bookmark(req.user!.id, req.params.activityId)));
  };

  unbookmark = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.unbookmark(req.user!.id, req.params.activityId)));
  };

  share = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.share(req.user!.id, req.params.activityId, req.body.target)));
  };
}
