import { Entity, Column, ManyToOne, Index } from "typeorm";
import { User } from "./user.entity";
import { AppBaseEntity } from "./base.entity";

@Entity({ name: "refresh_tokens" })
export class RefreshToken extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  user!: User;

  @Index()
  @Column({ type: "varchar", length: 255 })
  tokenHash!: string;

  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  revokedAt?: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  replacedByTokenHash?: string | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  createdByIp?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  userAgent?: string | null;
}