import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvitedUserStatus1773927000000 implements MigrationInterface {
  name = "AddInvitedUserStatus1773927000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."user_status_enum" ADD VALUE IF NOT EXISTS 'INVITED'`
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL enums do not support removing individual values safely.
  }
}
