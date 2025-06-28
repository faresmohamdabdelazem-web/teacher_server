"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherStatsDto = exports.StatsPeriod = void 0;
const class_validator_1 = require("class-validator");
var StatsPeriod;
(function (StatsPeriod) {
    StatsPeriod["DAILY"] = "daily";
    StatsPeriod["WEEKLY"] = "weekly";
    StatsPeriod["MONTHLY"] = "monthly";
})(StatsPeriod || (exports.StatsPeriod = StatsPeriod = {}));
class TeacherStatsDto {
}
exports.TeacherStatsDto = TeacherStatsDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TeacherStatsDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(StatsPeriod),
    __metadata("design:type", String)
], TeacherStatsDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TeacherStatsDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TeacherStatsDto.prototype, "endDate", void 0);
//# sourceMappingURL=teacher-stats.dto.js.map