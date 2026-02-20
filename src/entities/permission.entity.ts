import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;
}
