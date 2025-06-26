"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAttendanceIdToLesson1700000000005 = void 0;
const typeorm_1 = require("typeorm");
class AddAttendanceIdToLesson1700000000005 {
    constructor() {
        this.name = 'AddAttendanceIdToLesson1700000000005';
    }
    async up(queryRunner) {
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'attendanceId',
            type: 'varchar',
            length: '7',
            isNullable: false,
            isUnique: true,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('lessons', 'attendanceId');
    }
}
exports.AddAttendanceIdToLesson1700000000005 = AddAttendanceIdToLesson1700000000005;
//# sourceMappingURL=1700000000005-AddAttendanceIdToLesson.js.map