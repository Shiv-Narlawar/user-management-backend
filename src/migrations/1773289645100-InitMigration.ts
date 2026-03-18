import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1773289645100 implements MigrationInterface {
    name = 'InitMigration1773289645100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying NOT NULL, "entityType" character varying, "entityId" character varying, "metadata" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "actorId" uuid, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_2dc33f7f3c22e2e7badafca1d12"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }

}
