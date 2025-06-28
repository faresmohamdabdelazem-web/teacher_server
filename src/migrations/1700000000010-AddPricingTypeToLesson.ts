import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPricingTypeToLesson1700000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'pricingType',
        type: 'enum',
        enum: ['per_lesson', 'monthly'],
        default: "'per_lesson'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lessons', 'pricingType');
  }
} 