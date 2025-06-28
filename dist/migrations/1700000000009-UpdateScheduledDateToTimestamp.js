"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateScheduledDateToTimestamp1700000000009 = void 0;
class UpdateScheduledDateToTimestamp1700000000009 {
    constructor() {
        this.name = 'UpdateScheduledDateToTimestamp1700000000009';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "scheduledDate" TYPE TIMESTAMP`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "lessons" ALTER COLUMN "scheduledDate" TYPE DATE`);
    }
}
exports.UpdateScheduledDateToTimestamp1700000000009 = UpdateScheduledDateToTimestamp1700000000009;
//# sourceMappingURL=1700000000009-UpdateScheduledDateToTimestamp.js.map