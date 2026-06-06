import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { GoalService } from "./goal.service";

export class GoalController {
  constructor(private service = new GoalService()) {}

  list = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.list(req.user!.id)));
  };

  create = async (req: Request, res: Response) => {
    res.status(201).json(new ApiResponse(await this.service.create(req.user!.id, req.body), "Goal created"));
  };

  update = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.update(req.user!.id, req.params.id, req.body), "Goal updated"));
  };

  delete = async (req: Request, res: Response) => {
    res.json(new ApiResponse(await this.service.delete(req.user!.id, req.params.id), "Goal deleted"));
  };
}
