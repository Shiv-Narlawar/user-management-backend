import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1773145236347 implements MigrationInterface {
    name = 'InitMigration1773145236347'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "FK_2147eb9946aa96094b7f78b1954"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2147eb9946aa96094b7f78b195"`);
        await queryRunner.query(`ALTER TABLE "department" ALTER COLUMN "managerId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roleName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetCodeExpiry"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetCodeExpiry" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tempPasswordExpiry"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "tempPasswordExpiry" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roleId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "FK_2147eb9946aa96094b7f78b1954" FOREIGN KEY ("managerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`);
        await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "FK_2147eb9946aa96094b7f78b1954"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roleId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tempPasswordExpiry"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "tempPasswordExpiry" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetCodeExpiry"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetCodeExpiry" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "roleName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "department" ALTER COLUMN "managerId" SET NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2147eb9946aa96094b7f78b195" ON "department" ("managerId") `);
        await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "FK_2147eb9946aa96094b7f78b1954" FOREIGN KEY ("managerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

}
