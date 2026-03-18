import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1773304802099 implements MigrationInterface {
    name = 'InitMigration1773304802099'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "message" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "message"`);
    }

}
