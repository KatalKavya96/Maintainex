import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return res.status(400).json({ message: firstIssue?.message ?? "Validation failed", errors: result.error.flatten() });
    }
    next();
  };
