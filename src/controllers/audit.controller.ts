import { Response } from "express";
import { AppDataSource } from "../config/data-source";
import { AuditLog } from "../entities/audit.entity";
import { AuthRequest } from "../types/auth-request";

export class AuditController {
  private repo = AppDataSource.getRepository(AuditLog);

  getLogs = async (req: AuthRequest, res: Response) => {
    const logs = await this.repo.find({
      relations: ["actor"],
      order: { createdAt: "DESC" },
      take: 100,
    });

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
        createdAt: log.createdAt,
      })),
      total: logs.length,
      page: 1,
      totalPages: 1,
    });
  };
}