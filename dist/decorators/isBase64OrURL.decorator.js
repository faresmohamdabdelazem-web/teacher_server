"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsBase64OrURL = IsBase64OrURL;
const class_validator_1 = require("class-validator");
const IS_BASE64_OR_URL = 'IS_BASE64_OR_URL';
function IsBase64OrURL(validationOptions) {
    return (0, class_validator_1.ValidateBy)({
        name: IS_BASE64_OR_URL,
        validator: {
            validate: (value) => (0, class_validator_1.isURL)(value) || (0, class_validator_1.isBase64)(value),
            defaultMessage: (0, class_validator_1.buildMessage)((eachPrefix) => eachPrefix + '$property is not valid base64 or url', validationOptions),
        },
    }, validationOptions);
}
//# sourceMappingURL=isBase64OrURL.decorator.js.map