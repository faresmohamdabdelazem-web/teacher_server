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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assistant_entity_1 = require("./assistant.entity");
let AssistantService = class AssistantService {
    constructor(assistantRepository) {
        this.assistantRepository = assistantRepository;
    }
    async createWithUser(user, teacherId) {
        const assistant = this.assistantRepository.create({
            userId: user.userId,
            user,
            teacherId: teacherId || null
        });
        return await this.assistantRepository.save(assistant);
    }
    async createWithUserAndTeacher(user, teacherId) {
        const assistant = this.assistantRepository.create({
            userId: user.userId,
            user,
            teacherId
        });
        return await this.assistantRepository.save(assistant);
    }
    async findByTeacher(teacherId) {
        return await this.assistantRepository.find({
            where: { teacherId },
            relations: ['user'],
        });
    }
    async findByUserId(userId) {
        return await this.assistantRepository.findOne({
            where: { userId },
            relations: ['user', 'teacher'],
        });
    }
};
exports.AssistantService = AssistantService;
exports.AssistantService = AssistantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assistant_entity_1.Assistant)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AssistantService);
//# sourceMappingURL=assistant.service.js.map