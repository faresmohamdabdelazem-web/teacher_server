"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTotalEarningsToLesson1700000000004 = void 0;
const typeorm_1 = require("typeorm");
class AddTotalEarningsToLesson1700000000004 {
    constructor() {
        this.name = 'AddTotalEarningsToLesson1700000000004';
    }
    async up(queryRunner) {
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'totalEarnings',
            type: 'float',
            isNullable: false,
            default: 0,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('lessons', 'totalEarnings');
    }
}
exports.AddTotalEarningsToLesson1700000000004 = AddTotalEarningsToLesson1700000000004;
//# sourceMappingURL=1700000000004-AddTotalEarningsToLesson.js.map