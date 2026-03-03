import { MigrationInterface, QueryRunner } from "typeorm";

export class PermissionStructure1771933484827 implements MigrationInterface {
    name = 'PermissionStructure1771933484827'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "resetCode" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetCodeExpiry" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetCodeExpiry"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetCode"`);
    }

}
