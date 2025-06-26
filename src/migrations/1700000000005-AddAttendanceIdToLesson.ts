import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAttendanceIdToLesson1700000000005 implements MigrationInterface {
  name = 'AddAttendanceIdToLesson1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lessons',
      new TableColumn({
        name: 'attendanceId',
        type: 'varchar',
        length: '7',
        isNullable: false,
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lessons', 'attendanceId');
  }
} 