import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { LeaderboardsService } from "./leaderboards.service";

export class LeaderboardsController {
  constructor(private service = new LeaderboardsService()) {}

  topContributors = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.topContributors()));
  };

  topOrganizations = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.topOrganizations()));
  };

  activeRepositories = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.activeRepositories()));
  };

  openSourceIndex = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.openSourceIndex()));
  };

  collections = async (_req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.collections()));
  };
}
