import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  Index,
  DeleteDateColumn,
  JoinColumn,
} from "typeorm";
import { Role, RoleName } from "./role.entity";
import { RefreshToken } from "./refresh-token.entity";
import { AppBaseEntity } from "./base.entity";
import { Department } from "./department.entity";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

@Entity()
export class User extends AppBaseEntity {
  @Column()
  name!: string;

  @Index({ unique: true })
@Column({ type: "varchar" })
email!: string;

  @Column({ type: "varchar", select: false })
password!: string;


  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Index()
  @Column({
    type: "enum",
    enum: RoleName,
    default: RoleName.USER,
    nullable: true,
  })
  roleName?: RoleName | null;

  @DeleteDateColumn()
  deletedAt?: Date | null;

  @Index()
  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  role?: Role | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  departmentId?: string | null;

  @ManyToOne(() => Department, (d) => d.users, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "departmentId" })
  department?: Department | null;

  @Column({ type: "varchar", nullable: true })
resetCode?: string | null;

@Column({ type: "timestamptz", nullable: true })
resetCodeExpiry?: Date | null;

  @OneToMany(() => RefreshToken, (rt) => rt.user)
  refreshTokens!: RefreshToken[];

  @Column({ default: false })
mustChangePassword!: boolean;

@Column({ type: "timestamptz", nullable: true })
tempPasswordExpiry?: Date | null;}