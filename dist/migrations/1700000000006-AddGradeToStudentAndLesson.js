"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGradeToStudentAndLesson1700000000006 = void 0;
const typeorm_1 = require("typeorm");
class AddGradeToStudentAndLesson1700000000006 {
    constructor() {
        this.name = 'AddGradeToStudentAndLesson1700000000006';
    }
    async up(queryRunner) {
        await queryRunner.addColumn('students', new typeorm_1.TableColumn({
            name: 'grade',
            type: 'varchar',
            isNullable: true,
        }));
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'grade',
            type: 'varchar',
            isNullable: true,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('students', 'grade');
        await queryRunner.dropColumn('lessons', 'grade');
    }
}
exports.AddGradeToStudentAndLesson1700000000006 = AddGradeToStudentAndLesson1700000000006;
//# sourceMappingURL=1700000000006-AddGradeToStudentAndLesson.js.map