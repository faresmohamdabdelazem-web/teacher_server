"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertStudentIdToULID1700000000007 = void 0;
const typeorm_1 = require("typeorm");
class ConvertStudentIdToULID1700000000007 {
    constructor() {
        this.name = 'ConvertStudentIdToULID1700000000007';
    }
    async up(queryRunner) {
        await queryRunner.changeColumn('students', 'id', new typeorm_1.TableColumn({
            name: 'id',
            type: 'varchar',
            length: '26',
            isPrimary: true,
            isGenerated: false,
        }));
        await queryRunner.changeColumn('lesson_students', 'studentId', new typeorm_1.TableColumn({
            name: 'studentId',
            type: 'varchar',
            length: '26',
            isNullable: false,
        }));
        await queryRunner.changeColumn('teacher_students', 'studentId', new typeorm_1.TableColumn({
            name: 'studentId',
            type: 'varchar',
            length: '26',
            isNullable: false,
        }));
        await queryRunner.changeColumn('lesson_attendance', 'studentId', new typeorm_1.TableColumn({
            name: 'studentId',
            type: 'varchar',
            length: '26',
            isNullable: false,
        }));
    }
    async down(queryRunner) {
        await queryRunner.changeColumn('lesson_attendance', 'studentId', new typeorm_1.TableColumn({
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
        }));
        await queryRunner.changeColumn('teacher_students', 'studentId', new typeorm_1.TableColumn({
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
        }));
        await queryRunner.changeColumn('lesson_students', 'studentId', new typeorm_1.TableColumn({
            name: 'studentId',
            type: 'uuid',
            isNullable: false,
        }));
        await queryRunner.changeColumn('students', 'id', new typeorm_1.TableColumn({
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
        }));
    }
}
exports.ConvertStudentIdToULID1700000000007 = ConvertStudentIdToULID1700000000007;
//# sourceMappingURL=1700000000007-ConvertStudentIdToULID.js.map