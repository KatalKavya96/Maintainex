import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { PinService } from "./pin.service";

export class PinController {
  constructor(private service = new PinService()) {}

  create = async (req: Request, res: Response) => res.status(201).json(new ApiResponse(await this.service.create(req.user!.id, req.body), "Pin created"));
  list = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.list(req.user!.id, req.query as Record<string, string | undefined>)));
  get = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.get(req.user!.id, req.params.id)));
  update = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.update(req.user!.id, req.params.id, req.body), "Pin updated"));
  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.user!.id, req.params.id);
    res.json(new ApiResponse(null, "Pin deleted"));
  };
  opened = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.markOpened(req.user!.id, req.params.id), "Pin opened"));
  favorite = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.toggleFavorite(req.user!.id, req.params.id, req.body.isFavorite), "Pin favorite updated"));
  reorder = async (req: Request, res: Response) => res.json(new ApiResponse(await this.service.reorder(req.user!.id, req.body.items), "Pins reordered"));
}
