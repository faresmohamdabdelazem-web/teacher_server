import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateScheduledDateToTimestamp1700000000009 implements MigrationInterface {
    name = 'UpdateScheduledDateToTimestamp1700000000009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "scheduledDate" TYPE TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "scheduledDate" TYPE DATE`);
    }
} 