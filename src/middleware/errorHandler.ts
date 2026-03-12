import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

function isPgUniqueViolation(err: any): boolean {
  
  return !!err && typeof err === "object" && err.code === "23505";
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  
  if (isPgUniqueViolation(err)) {
   
    return res.status(409).json({ message: "Resource already exists" });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Internal Server Error" });
}