"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumberPipe = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const phone_number_helper_1 = require("./phone-number.helper");
let PhoneNumberPipe = class PhoneNumberPipe {
    async transform(value, metadata) {
        if (value) {
            const object = (0, class_transformer_1.plainToInstance)(metadata.metatype, value);
            if (object.phone) {
                object.phone = (0, phone_number_helper_1.makePhoneObject)((0, phone_number_helper_1.assignPlusToNumber)(object.phone));
            }
            return (0, class_transformer_1.plainToInstance)(metadata.metatype, object);
        }
        return value;
    }
};
exports.PhoneNumberPipe = PhoneNumberPipe;
exports.PhoneNumberPipe = PhoneNumberPipe = __decorate([
    (0, common_1.Injectable)()
], PhoneNumberPipe);
//# sourceMappingURL=phone-number.pipe.js.map