import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1773662569741 implements MigrationInterface {
    name = 'InitMigration1773662569741'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "auth0Sub" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_d3c708de81375ef86c54cfe019e" UNIQUE ("auth0Sub")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_d3c708de81375ef86c54cfe019e"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "auth0Sub"`);
    }

}
