import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1772534237986 implements MigrationInterface {
    name = 'InitMigration1772534237986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "mustChangePassword" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user" ADD "tempPasswordExpiry" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tempPasswordExpiry"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "mustChangePassword"`);
    }

}
