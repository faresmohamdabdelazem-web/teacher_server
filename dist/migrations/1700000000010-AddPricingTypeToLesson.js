"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPricingTypeToLesson1700000000010 = void 0;
const typeorm_1 = require("typeorm");
class AddPricingTypeToLesson1700000000010 {
    async up(queryRunner) {
        await queryRunner.addColumn('lessons', new typeorm_1.TableColumn({
            name: 'pricingType',
            type: 'enum',
            enum: ['per_lesson', 'monthly'],
            default: "'per_lesson'",
            isNullable: false,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('lessons', 'pricingType');
    }
}
exports.AddPricingTypeToLesson1700000000010 = AddPricingTypeToLesson1700000000010;
//# sourceMappingURL=1700000000010-AddPricingTypeToLesson.js.map