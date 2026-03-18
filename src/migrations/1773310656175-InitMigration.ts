import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1773310656175 implements MigrationInterface {
    name = 'InitMigration1773310656175'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "authProviderId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "authProviderId"`);
    }

}
