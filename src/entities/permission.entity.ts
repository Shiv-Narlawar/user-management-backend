import { Entity, Column, ManyToMany } from "typeorm";
import { Role } from "./role.entity";
import { AppBaseEntity } from "./base.entity";

@Entity()
export class Permission extends AppBaseEntity {
  @Column({ unique: true })
  name!: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];
}