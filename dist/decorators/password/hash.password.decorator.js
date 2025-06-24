"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashPassword = HashPassword;
const class_transformer_1 = require("class-transformer");
const helper_1 = require("./helper");
function HashPassword() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return value;
        if (typeof value === 'string' && value.startsWith('$2b$')) {
            console.log('Password already hashed, skipping hash');
            return value;
        }
        console.log('Hashing password:', value);
        const hashedPassword = (0, helper_1.hashPasswordSync)(value);
        console.log('Hashed password:', hashedPassword);
        return hashedPassword;
    });
}
//# sourceMappingURL=hash.password.decorator.js.map