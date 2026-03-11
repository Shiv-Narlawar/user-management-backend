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

  // Manager is optional when creating department
  @Column({ type: "uuid", nullable: true })
  managerId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "managerId" })
  manager!: User | null;

  // Department -> many users
  @OneToMany(() => User, (u) => u.department)
  users!: User[];
}