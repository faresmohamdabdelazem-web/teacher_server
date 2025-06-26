"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTeacherToAssistant1700000000001 = void 0;
const typeorm_1 = require("typeorm");
class AddTeacherToAssistant1700000000001 {
    constructor() {
        this.name = 'AddTeacherToAssistant1700000000001';
    }
    async up(queryRunner) {
        await queryRunner.addColumn('assistants', new typeorm_1.TableColumn({
            name: 'teacherId',
            type: 'uuid',
            isNullable: true,
        }));
        await queryRunner.createForeignKey('assistants', new typeorm_1.TableForeignKey({
            columnNames: ['teacherId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'teachers',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        }));
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable('assistants');
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('teacherId') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('assistants', foreignKey);
        }
        await queryRunner.dropColumn('assistants', 'teacherId');
    }
}
exports.AddTeacherToAssistant1700000000001 = AddTeacherToAssistant1700000000001;
//# sourceMappingURL=1700000000001-AddTeacherToAssistant.js.map