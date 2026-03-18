import { Response } from "express";
import { ILike } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { AuditLog } from "../entities/audit.entity";
import { AuthRequest } from "../types/auth-request";

export class AuditController {
  private repo = AppDataSource.getRepository(AuditLog);

  getLogs = async (req: AuthRequest, res: Response) => {
    try {
      const search =
        typeof req.query.search === "string" ? req.query.search.trim() : "";

      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.max(Number(req.query.limit) || 10, 1);
      const skip = (page - 1) * limit;

      const where = search
        ? [
            { action: ILike(`%${search}%`) },
            { entityType: ILike(`%${search}%`) },
            { entityId: ILike(`%${search}%`) },
            { message: ILike(`%${search}%`) },
            { actor: { email: ILike(`%${search}%`) } },
            { actor: { name: ILike(`%${search}%`) } },
          ]
        : undefined;

      const [logs, total] = await this.repo.findAndCount({
        where,
        relations: ["actor"],
        order: { createdAt: "DESC" },
        skip,
        take: limit,
      });

      const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

      return res.json({
        data: logs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          actorId: log.actorId,
          actorEmail: log.actor?.email,
          actorName: log.actor?.name,
          message: log.message,
          createdAt: log.createdAt
            ? new Date(log.createdAt).toISOString()
            : null,
        })),
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);

      return res.status(500).json({
        message: "Failed to fetch audit logs",
      });
    }
  };
}