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
exports.PaginatedRequestDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class PaginatedRequestDto {
    constructor() {
        this.page = 1;
        this.take = 20;
    }
}
exports.PaginatedRequestDto = PaginatedRequestDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Page must be an integer' }),
    (0, class_validator_1.IsPositive)({ message: 'Page must be a positive integer' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Object)
], PaginatedRequestDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Take must be an integer' }),
    (0, class_validator_1.IsPositive)({ message: 'Take must be a positive integer' }),
    (0, class_validator_1.Max)(20, { message: 'Take cannot exceed 20' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    __metadata("design:type", Object)
], PaginatedRequestDto.prototype, "take", void 0);
//# sourceMappingURL=paginated-req.dto.js.map