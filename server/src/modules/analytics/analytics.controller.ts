import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { AnalyticsService } from "./analytics.service";

export class AnalyticsController {
  constructor(private service = new AnalyticsService()) {}

  summary = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.summary()));
  daily = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.daily()));
  weekly = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.weekly()));
  monthly = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.monthly()));
  yearly = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.yearly()));
  repositories = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.repositories()));
  organizations = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.organizations()));
  activityTypes = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.activityTypes()));
}
