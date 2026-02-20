import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { AppBaseEntity } from "./base.entity";
import { User } from "./user.entity";

@Entity()
export class Department extends AppBaseEntity {
  @Index({ unique: true })
  @Column()
  name!: string;

  // One department -> one manager
  @Index({ unique: true })
  @Column({ type: "uuid" })
  managerId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "managerId" })
  manager!: User;

  // Department -> many users
  @OneToMany(() => User, (u) => u.department)
  users!: User[];
}