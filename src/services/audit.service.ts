import { AppDataSource } from "../config/data-source";
import { AuditLog } from "../entities/audit.entity";

export interface AuditLogParams {
  action: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export class AuditService {

  private repo = AppDataSource.getRepository(AuditLog);

  async log(params: AuditLogParams): Promise<void> {

    const log = this.repo.create({
      action: params.action,
      actorId: params.actorId,
      entityType: params.entityType,
      entityId: params.entityId,
      message: params.message,
      metadata: params.metadata,
    });

    await this.repo.save(log);
  }

}