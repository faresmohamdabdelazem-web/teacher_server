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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsController = void 0;
const common_1 = require("@nestjs/common");
const assets_service_1 = require("./assets.service");
const path_1 = __importDefault(require("path"));
const filter_assets_dto_1 = require("./filter-assets.dto");
const promises_1 = require("fs/promises");
let AssetsController = class AssetsController {
    constructor(assetsService) {
        this.assetsService = assetsService;
    }
    async getCountries(paginatedRequestDto) {
        const { withStates, iso2 } = paginatedRequestDto;
        const filePath = path_1.default.resolve(__dirname, '..', '..', 'countries.json');
        const file = await (0, promises_1.readFile)(filePath, { encoding: 'utf-8' });
        const countries = JSON.parse(file);
        if (iso2) {
            const targetCountry = countries.find((country) => country.iso2 === iso2);
            if (!withStates) {
                delete targetCountry.states;
            }
            return { targetCountry };
        }
        if (!withStates) {
            countries.forEach((country) => delete country.states);
        }
        return { countries };
    }
};
exports.AssetsController = AssetsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_assets_dto_1.FilterAssetsDto]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "getCountries", null);
exports.AssetsController = AssetsController = __decorate([
    (0, common_1.Controller)('assets'),
    __metadata("design:paramtypes", [assets_service_1.AssetsService])
], AssetsController);
//# sourceMappingURL=assets.controller.js.map