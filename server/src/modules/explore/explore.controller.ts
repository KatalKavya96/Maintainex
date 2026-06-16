import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { ExploreService } from "./explore.service";

export class ExploreController {
  constructor(private service = new ExploreService()) {}

  organizations = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.listOrganizations(req.user!.id, req.query as Record<string, string | string[] | undefined>)));
  };

  organization = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.getOrganization(req.user!.id, req.params.slug)));
  };

  contributors = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.contributors(req.params.slug)));
  };

  repositories = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.repositories(req.params.slug)));
  };

  quests = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.quests(req.params.slug)));
  };

  save = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.toggleSavedOpportunity(req.user!.id, req.body)));
  };

  saved = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.savedOpportunities(req.user!.id)));
  };
}
