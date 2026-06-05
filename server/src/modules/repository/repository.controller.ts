import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { RepositoryService } from "./repository.service";

export class RepositoryController {
  constructor(private service = new RepositoryService()) {}

  create = async (req: Request, res: Response) => res.status(201).json(new ApiResponse(await this.service.create(req.body), "Repository created"));
  list = async (_req: Request, res: Response) => res.json(new ApiResponse(await this.service.list()));
  get = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.get(req.params.id)));
  update = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.update(req.params.id, req.body), "Repository updated"));
  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.json(new ApiResponse(null, "Repository deleted"));
  };
}
