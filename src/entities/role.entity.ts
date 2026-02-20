import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
} from "typeorm";
import { Permission } from "./permission.entity";
import { User } from "./user.entity";

@Entity()
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions!: Permission[];

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}
