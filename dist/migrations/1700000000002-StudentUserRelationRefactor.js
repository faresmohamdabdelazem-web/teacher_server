"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentUserRelationRefactor1700000000002 = void 0;
const typeorm_1 = require("typeorm");
class StudentUserRelationRefactor1700000000002 {
    constructor() {
        this.name = 'StudentUserRelationRefactor1700000000002';
    }
    async up(queryRunner) {
        const table = await queryRunner.getTable('students');
        const oldFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('id') !== -1);
        if (oldFk) {
            await queryRunner.dropForeignKey('students', oldFk);
        }
        await queryRunner.addColumn('students', new typeorm_1.TableColumn({
            name: 'userId',
            type: 'uuid',
            isNullable: true,
        }));
        await queryRunner.createForeignKey('students', new typeorm_1.TableForeignKey({
            columnNames: ['userId'],
            referencedColumnNames: ['userId'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        }));
    }
    async down(queryRunner) {
        const table = await queryRunner.getTable('students');
        const userIdFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
        if (userIdFk) {
            await queryRunner.dropForeignKey('students', userIdFk);
        }
        await queryRunner.dropColumn('students', 'userId');
    }
}
exports.StudentUserRelationRefactor1700000000002 = StudentUserRelationRefactor1700000000002;
//# sourceMappingURL=1700000000002-StudentUserRelationRefactor.js.map