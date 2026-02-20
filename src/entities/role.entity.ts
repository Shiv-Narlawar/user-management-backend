import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from "typeorm";
import { Permission } from "./permission.entity";
import { User } from "./user.entity";
import { AppBaseEntity } from "./base.entity";

export enum RoleName {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
}

@Entity()
export class Role extends AppBaseEntity {
  @Index({ unique: true }) 
  @Column({
    type: "enum",
    enum: RoleName,
  })
  name!: RoleName;

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions!: Permission[];

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}