"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsPhoneNumberStringOrNumber = IsPhoneNumberStringOrNumber;
const class_validator_1 = require("class-validator");
const phone_number_helper_1 = require("../shared/phone-number.helper");
const IS_PHONE_NUMBER = 'IS_PHONE_NUMBER_ENHANCED';
function IsPhoneNumberStringOrNumber(validationOptions) {
    return (0, class_validator_1.ValidateBy)({
        name: IS_PHONE_NUMBER,
        validator: {
            validate: (value) => {
                if (typeof value == 'string') {
                    return (0, phone_number_helper_1.isValidPhoneNumber)((0, phone_number_helper_1.assignPlusToNumber)(value));
                }
                if (typeof value == 'number') {
                    return (0, phone_number_helper_1.isValidPhoneNumber)((0, phone_number_helper_1.assignPlusToNumber)(value));
                }
                return false;
            },
            defaultMessage: (0, class_validator_1.buildMessage)((eachPrefix) => eachPrefix + '$property is not valid phone number', validationOptions),
        },
    }, validationOptions);
}
//# sourceMappingURL=isPhoneNumber.js.map