"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLessonAttendanceSystem1700000000000 = void 0;
const typeorm_1 = require("typeorm");
class AddLessonAttendanceSystem1700000000000 {
    async up(queryRunner) {
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'attendanceStartTime',
            type: 'timestamp',
            isNullable: true,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'recurrenceType',
            type: 'enum',
            enum: ['none', 'daily', 'weekly', 'monthly'],
            default: "'none'",
            isNullable: false,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'recurrencePattern',
            type: 'json',
            isNullable: true,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'status',
            type: 'enum',
            enum: ['scheduled', 'attendance_open', 'in_progress', 'completed', 'cancelled'],
            default: "'scheduled'",
            isNullable: false,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'content',
            type: 'text',
            isNullable: true,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'grade',
            type: 'varchar',
            isNullable: true,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'difficulty',
            type: 'varchar',
            isNullable: true,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'duration',
            type: 'int',
            isNullable: true,
        }));
        await queryRunner.createTable(new typeorm_1.Table({
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
        }));
        await queryRunner.createForeignKey('lesson_attendance', new typeorm_1.TableForeignKey({
            columnNames: ['lessonId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'lessons',
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('lesson_attendance', new typeorm_1.TableForeignKey({
            columnNames: ['studentId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'students',
            onDelete: 'CASCADE',
        }));
        await queryRunner.createIndex('lesson_attendance', new typeorm_1.TableIndex({
            name: 'IDX_LESSON_ATTENDANCE_LESSON_ID',
            columnNames: ['lessonId'],
        }));
        await queryRunner.createIndex('lesson_attendance', new typeorm_1.TableIndex({
            name: 'IDX_LESSON_ATTENDANCE_STUDENT_ID',
            columnNames: ['studentId'],
        }));
        await queryRunner.createIndex('lesson_attendance', new typeorm_1.TableIndex({
            name: 'IDX_LESSON_ATTENDANCE_LESSON_STUDENT',
            columnNames: ['lessonId', 'studentId'],
        }));
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable('lesson_attendance');
        const foreignKeys = table.foreignKeys;
        for (const foreignKey of foreignKeys) {
            await queryRunner.dropForeignKey('lesson_attendance', foreignKey);
        }
        await queryRunner.dropIndex('lesson_attendance', 'IDX_LESSON_ATTENDANCE_LESSON_ID');
        await queryRunner.dropIndex('lesson_attendance', 'IDX_LESSON_ATTENDANCE_STUDENT_ID');
        await queryRunner.dropIndex('lesson_attendance', 'IDX_LESSON_ATTENDANCE_LESSON_STUDENT');
        await queryRunner.dropTable('lesson_attendance');
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
exports.AddLessonAttendanceSystem1700000000000 = AddLessonAttendanceSystem1700000000000;
//# sourceMappingURL=1700000000000-AddLessonAttendanceSystem.js.map