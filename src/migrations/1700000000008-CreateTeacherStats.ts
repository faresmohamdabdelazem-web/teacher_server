import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTeacherStats1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'teacher_stats',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'teacherId',
            type: 'uuid',
          },
          {
            name: 'period',
            type: 'enum',
            enum: ['daily', 'weekly', 'monthly'],
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'totalLessons',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalStudents',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalAttendance',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalEarnings',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'averageEarningsPerLesson',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'averageStudentsPerLesson',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'completionRate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'completedLessons',
            type: 'int',
            default: 0,
          },
          {
            name: 'cancelledLessons',
            type: 'int',
            default: 0,
          },
          {
            name: 'expiredLessons',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'teacher_stats',
      new TableForeignKey({
        columnNames: ['teacherId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teacher',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for better performance
    await queryRunner.query(
      'CREATE INDEX IDX_teacher_stats_teacher_period_date ON teacher_stats (teacherId, period, date)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('teacher_stats');
  }
} 