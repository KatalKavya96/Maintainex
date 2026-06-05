import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { AnalyticsService } from "./analytics.service";

export class AnalyticsController {
  constructor(private service = new AnalyticsService()) {}

  summary = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.summary(req.user!.id)));
  daily = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.daily(req.user!.id)));
  weekly = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.weekly(req.user!.id)));
  monthly = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.monthly(req.user!.id)));
  yearly = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.yearly(req.user!.id)));
  repositories = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.repositories(req.user!.id)));
  organizations = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.organizations(req.user!.id)));
  activityTypes = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.activityTypes(req.user!.id)));
}
