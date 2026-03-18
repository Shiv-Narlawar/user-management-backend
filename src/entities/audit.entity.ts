import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { User } from "./user.entity";

@Entity("audit_logs")
export class AuditLog {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  action!: string;

  @Column({ nullable: true })
  entityType?: string;

  @Column({ nullable: true })
  entityId?: string;

   @Column({ nullable: true })
   message?: string;

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "actorId" })
  actor?: User;

  @Column({ nullable: true })
  actorId?: string;
}