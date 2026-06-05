import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { ActivityService } from "./activity.service";

export class ActivityController {
  constructor(private service = new ActivityService()) {}

  create = async (req: Request, res: Response) => {
    const data = await this.service.create(req.body);
    res.status(201).json(new ApiResponse(data, "Activity created"));
  };

  list = async (req: Request, res: Response) => {
    const data = await this.service.list(req.query as Record<string, string | undefined>);
    res.json(new ApiResponse(data));
  };

  get = async (req: Request, res: Response) => {
    const data = await this.service.get(req.params.id);
    res.json(new ApiResponse(data));
  };

  update = async (req: Request, res: Response) => {
    const data = await this.service.update(req.params.id, req.body);
    res.json(new ApiResponse(data, "Activity updated"));
  };

  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.json(new ApiResponse(null, "Activity deleted"));
  };

  deleteAll = async (_req: Request, res: Response) => {
    const data = await this.service.deleteAll();
    res.json(new ApiResponse(data, "All activities deleted"));
  };
}
