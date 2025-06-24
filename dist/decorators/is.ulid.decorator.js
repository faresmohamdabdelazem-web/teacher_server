"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IS_ULID = void 0;
exports.isULID = isULID;
exports.IsULID = IsULID;
const class_validator_1 = require("class-validator");
exports.IS_ULID = 'isUlid';
const pattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
function isULID(value) {
    return typeof value === 'string' && pattern.test(value);
}
function IsULID(validationOptions) {
    return (0, class_validator_1.ValidateBy)({
        name: exports.IS_ULID,
        validator: {
            validate: (value) => isULID(value),
            defaultMessage: (0, class_validator_1.buildMessage)((eachPrefix) => eachPrefix + '$property must be an ULID', validationOptions),
        },
    }, validationOptions);
}
//# sourceMappingURL=is.ulid.decorator.js.map