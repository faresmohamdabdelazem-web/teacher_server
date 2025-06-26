import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ConvertStudentIdToULID1700000000007 implements MigrationInterface {
  name = 'ConvertStudentIdToULID1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change the id column type from UUID to VARCHAR(26) for ULID
    await queryRunner.changeColumn(
      'students',
      'id',
      new TableColumn({
        name: 'id',
        type: 'varchar',
        length: '26',
        isPrimary: true,
        isGenerated: false,
      }),
    );

    // Update related foreign key columns in other tables
    // Update lesson_students junction table
    await queryRunner.changeColumn(
      'lesson_students',
      'studentId',
      new TableColumn({
        name: 'studentId',
        type: 'varchar',
        length: '26',
        isNullable: false,
      }),
    );

    // Update teacher_students junction table
    await queryRunner.changeColumn(
      'teacher_students',
      'studentId',
      new TableColumn({
        name: 'studentId',
        type: 'varchar',
        length: '26',
        isNullable: false,
      }),
    );

    // Update lesson_attendance table
    await queryRunner.changeColumn(
      'lesson_attendance',
      'studentId',
      new TableColumn({
        name: 'studentId',
        type: 'varchar',
        length: '26',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert lesson_attendance table
    await queryRunner.changeColumn(
      'lesson_attendance',
      'studentId',
      new TableColumn({
        name: 'studentId',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Revert teacher_students junction table
    await queryRunner.changeColumn(
      'teacher_students',
      'studentId',
      new TableColumn({
        name: 'studentId',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Revert lesson_students junction table
    await queryRunner.changeColumn(
      'lesson_students',
      'studentId',
      new TableColumn({
        name: 'studentId',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Revert students table
    await queryRunner.changeColumn(
      'students',
      'id',
      new TableColumn({
        name: 'id',
        type: 'uuid',
        isPrimary: true,
        isGenerated: true,
        generationStrategy: 'uuid',
      }),
    );
  }
} 