import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTotalEarningsToLesson1700000000004 implements MigrationInterface {
  name = 'AddTotalEarningsToLesson1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'totalEarnings',
        type: 'float',
        isNullable: false,
        default: 0,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lessons', 'totalEarnings');
  }
} 