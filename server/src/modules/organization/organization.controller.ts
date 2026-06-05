import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { OrganizationService } from "./organization.service";

export class OrganizationController {
  constructor(private service = new OrganizationService()) {}

  create = async (req: Request, res: Response) => res.status(201).json(new ApiResponse(await this.service.create(req.user!.id, req.body), "Organization created"));
  list = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.list(req.user!.id)));
  get = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.get(req.user!.id, req.params.id)));
  update = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.update(req.user!.id, req.params.id, req.body), "Organization updated"));
  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.user!.id, req.params.id);
    res.json(new ApiResponse(null, "Organization deleted"));
  };
}
