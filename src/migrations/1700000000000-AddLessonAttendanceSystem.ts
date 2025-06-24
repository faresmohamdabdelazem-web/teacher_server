import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn, TableIndex } from 'typeorm';

export class AddLessonAttendanceSystem1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to lessons table
    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'attendanceStartTime',
      type: 'timestamp',
      isNullable: true,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'recurrenceType',
      type: 'enum',
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: "'none'",
      isNullable: false,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'recurrencePattern',
      type: 'json',
      isNullable: true,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'status',
      type: 'enum',
      enum: ['scheduled', 'attendance_open', 'in_progress', 'completed', 'cancelled'],
      default: "'scheduled'",
      isNullable: false,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'isActive',
      type: 'boolean',
      default: true,
      isNullable: false,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'content',
      type: 'text',
      isNullable: true,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'grade',
      type: 'varchar',
      isNullable: true,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'difficulty',
      type: 'varchar',
      isNullable: true,
    }));

    await queryRunner.addColumn('lessons', new TableColumn({
      name: 'duration',
      type: 'int',
      isNullable: true,
    }));

    // Create lesson_attendance table
    await queryRunner.createTable(
      new Table({
        name: 'lesson_attendance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'lessonId',
            type: 'uuid',
          },
          {
            name: 'studentId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['present', 'absent', 'late', 'excused'],
            default: "'absent'",
            isNullable: false,
          },
          {
            name: 'attendanceTime',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'markedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'lesson_attendance',
      new TableForeignKey({
        columnNames: ['lessonId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lessons',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'lesson_attendance',
      new TableForeignKey({
        columnNames: ['studentId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'students',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for better performance
    await queryRunner.createIndex(
      'lesson_attendance',
      new TableIndex({
        name: 'IDX_LESSON_ATTENDANCE_LESSON_ID',
        columnNames: ['lessonId'],
      }),
    );

    await queryRunner.createIndex(
      'lesson_attendance',
      new TableIndex({
        name: 'IDX_LESSON_ATTENDANCE_STUDENT_ID',
        columnNames: ['studentId'],
      }),
    );

    await queryRunner.createIndex(
      'lesson_attendance',
      new TableIndex({
        name: 'IDX_LESSON_ATTENDANCE_LESSON_STUDENT',
        columnNames: ['lessonId', 'studentId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('lesson_attendance');
    const foreignKeys = table.foreignKeys;
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey('lesson_attendance', foreignKey);
    }

    // Drop indexes
    await queryRunner.dropIndex('lesson_attendance', 'IDX_LESSON_ATTENDANCE_LESSON_ID');
    await queryRunner.dropIndex('lesson_attendance', 'IDX_LESSON_ATTENDANCE_STUDENT_ID');
    await queryRunner.dropIndex('lesson_attendance', 'IDX_LESSON_ATTENDANCE_LESSON_STUDENT');

    // Drop lesson_attendance table
    await queryRunner.dropTable('lesson_attendance');

    // Remove columns from lessons table
    await queryRunner.dropColumn('lessons', 'attendanceStartTime');
    await queryRunner.dropColumn('lessons', 'recurrenceType');
    await queryRunner.dropColumn('lessons', 'recurrencePattern');
    await queryRunner.dropColumn('lessons', 'status');
    await queryRunner.dropColumn('lessons', 'isActive');
    await queryRunner.dropColumn('lessons', 'content');
    await queryRunner.dropColumn('lessons', 'grade');
    await queryRunner.dropColumn('lessons', 'difficulty');
    await queryRunner.dropColumn('lessons', 'duration');
  }
} 