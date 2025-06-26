"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentNoUserRefactor1700000000003 = void 0;
const typeorm_1 = require("typeorm");
class StudentNoUserRefactor1700000000003 {
    constructor() {
        this.name = 'StudentNoUserRefactor1700000000003';
    }
    async up(queryRunner) {
        const table = await queryRunner.getTable('students');
        const userIdFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
        if (userIdFk) {
            await queryRunner.dropForeignKey('students', userIdFk);
        }
        const userIdCol = table.findColumnByName('userId');
        if (userIdCol) {
            await queryRunner.dropColumn('students', 'userId');
        }
        await queryRunner.addColumns('students', [
            new typeorm_1.TableColumn({
                name: 'firstName',
                type: 'varchar',
                isNullable: false,
                default: "''"
            }),
            new typeorm_1.TableColumn({
                name: 'lastName',
                type: 'varchar',
                isNullable: false,
                default: "''"
            }),
            new typeorm_1.TableColumn({
                name: 'phoneNumber',
                type: 'varchar',
                isNullable: true,
            }),
        ]);
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('students', 'firstName');
        await queryRunner.dropColumn('students', 'lastName');
        await queryRunner.dropColumn('students', 'phoneNumber');
        await queryRunner.addColumn('students', new typeorm_1.TableColumn({
            name: 'userId',
            type: 'uuid',
            isNullable: true,
        }));
    }
}
exports.StudentNoUserRefactor1700000000003 = StudentNoUserRefactor1700000000003;
//# sourceMappingURL=1700000000003-StudentNoUserRefactor.js.map