import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  UpdateDateColumn,
  CreateDateColumn,
} from "typeorm";
import { Permission } from "./permission.entity";
import { User } from "./user.entity";

@Entity()
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @CreateDateColumn()
    createdAt!: Date;
  
  @UpdateDateColumn()
    updatedAt!: Date;
  

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions!: Permission[];

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}
