import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { ScheduledWorkService } from "./scheduledWork.service";

export class ScheduledWorkController {
  constructor(private service = new ScheduledWorkService()) {}

  create = async (req: Request, res: Response) => res.status(201).json(new ApiResponse(await this.service.create(req.user!.id, req.body), "Scheduled work created"));
  list = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.list(req.user!.id, req.query as Record<string, string | undefined>)));
  get = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.get(req.user!.id, req.params.id)));
  update = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.update(req.user!.id, req.params.id, req.body), "Scheduled work updated"));
  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.user!.id, req.params.id);
    res.json(new ApiResponse(null, "Scheduled work deleted"));
  };
  updateStatus = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.updateStatus(req.user!.id, req.params.id, req.body.status), "Status updated"));
  markDone = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.markDone(req.user!.id, req.params.id), "Marked done"));
  markBlocked = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.markBlocked(req.user!.id, req.params.id), "Marked blocked"));
}
