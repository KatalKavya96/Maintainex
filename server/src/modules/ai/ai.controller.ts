import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { AiService } from "./ai.service";

export class AiController {
  constructor(private service = new AiService()) {}

  weeklyReport = async (req: Request, res: Response) => {
    const data = await this.service.weeklyReport(req.user!.id);
    res.json(new ApiResponse(data));
  };

  progressCoach = async (req: Request, res: Response) => {
    const data = await this.service.progressCoach(req.user!.id, req.body.question);
    res.json(new ApiResponse(data));
  };

  contributionPlan = async (req: Request, res: Response) => {
    const data = await this.service.contributionPlan(req.user!.id);
    res.json(new ApiResponse(data));
  };

  issuePrContext = async (req: Request, res: Response) => {
    const data = await this.service.issuePrContext(req.user!.id, req.body.url);
    res.json(new ApiResponse(data));
  };

  reviewNotes = async (req: Request, res: Response) => {
    const data = await this.service.reviewNotes(req.user!.id, req.body.notes);
    res.json(new ApiResponse(data));
  };

  maintainerMemory = async (req: Request, res: Response) => {
    const data = await this.service.maintainerMemory(req.user!.id);
    res.json(new ApiResponse(data));
  };
}
