import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1772459003939 implements MigrationInterface {
  name = "InitMigration1772459003939";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // -----------------------------
    // Permission timestamps
    // -----------------------------
    await queryRunner.query(`
      ALTER TABLE "permission"
      ADD COLUMN IF NOT EXISTS "createdAt"
      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE "permission"
      ADD COLUMN IF NOT EXISTS "updatedAt"
      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    `);

    // -----------------------------
    // Refresh token updatedAt
    // -----------------------------
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD COLUMN IF NOT EXISTS "updatedAt"
      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    `);

    // -----------------------------
    // Create user roleName enum
    // -----------------------------
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."user_rolename_enum"
        AS ENUM ('ADMIN', 'MANAGER', 'USER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "roleName"
      "public"."user_rolename_enum"
      NOT NULL DEFAULT 'USER'
    `);

    // -----------------------------
    // Create role enum safely
    // -----------------------------
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."role_name_enum"
        AS ENUM ('ADMIN', 'MANAGER', 'USER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // -----------------------------
    // SAFE CONVERSION of role.name
    // -----------------------------
    await queryRunner.query(`
      ALTER TABLE "role"
      ALTER COLUMN "name"
      TYPE "public"."role_name_enum"
      USING "name"::text::"public"."role_name_enum"
    `);

    // -----------------------------
    // Index for user.roleName
    // -----------------------------
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_roleName"
      ON "user" ("roleName")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_roleName"
    `);

    await queryRunner.query(`
      ALTER TABLE "role"
      ALTER COLUMN "name"
      TYPE character varying
      USING "name"::text
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."role_name_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN IF EXISTS "roleName"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."user_rolename_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP COLUMN IF EXISTS "updatedAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "permission"
      DROP COLUMN IF EXISTS "updatedAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "permission"
      DROP COLUMN IF EXISTS "createdAt"
    `);
  }
}