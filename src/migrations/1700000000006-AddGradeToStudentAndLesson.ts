import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGradeToStudentAndLesson1700000000006 implements MigrationInterface {
  name = 'AddGradeToStudentAndLesson1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add grade column to students table
    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'grade',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Add grade column to lessons table
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'grade',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('students', 'grade');
    await queryRunner.dropColumn('lessons', 'grade');
  }
} 