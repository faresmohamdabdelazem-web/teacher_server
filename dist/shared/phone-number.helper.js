"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPhoneNumber = isValidPhoneNumber;
exports.extractCountryCodeFromNumber = extractCountryCodeFromNumber;
exports.extractDialCodeFromNumber = extractDialCodeFromNumber;
exports.assignPlusToNumber = assignPlusToNumber;
exports.formatPhone = formatPhone;
exports.makePhoneObject = makePhoneObject;
const libphonenumber_js_1 = require("libphonenumber-js");
function isValidPhoneNumber(number) {
    try {
        return (0, libphonenumber_js_1.isValidNumber)(number);
    }
    catch (error) {
        return undefined;
    }
}
function extractCountryCodeFromNumber(number) {
    try {
        const parsedNumber = (0, libphonenumber_js_1.parsePhoneNumber)(number);
        return parsedNumber.country;
    }
    catch (error) {
        return undefined;
    }
}
function extractDialCodeFromNumber(number) {
    try {
        const parsedNumber = (0, libphonenumber_js_1.parsePhoneNumber)(number);
        return +parsedNumber.countryCallingCode;
    }
    catch (error) {
        return undefined;
    }
}
function assignPlusToNumber(number) {
    const parsedNumber = parseInt(number);
    return `+${parsedNumber}`;
}
function formatPhone(number) {
    try {
        const phone = (0, libphonenumber_js_1.parsePhoneNumber)(number);
        const INTERNATIONAL = phone.format('INTERNATIONAL');
        console.log(INTERNATIONAL);
        let formatted = '';
        for (let c = INTERNATIONAL.indexOf(' '); c < INTERNATIONAL.length; c++) {
            if (INTERNATIONAL.charAt(c) !== ' ') {
                formatted += INTERNATIONAL.charAt(c);
            }
        }
        return formatted;
    }
    catch (error) {
        return undefined;
    }
}
function makePhoneObject(phone) {
    return {
        phoneNumber: formatPhone(assignPlusToNumber(phone)),
        countryCode: extractCountryCodeFromNumber(assignPlusToNumber(phone)),
        dialCode: extractDialCodeFromNumber(assignPlusToNumber(phone)),
    };
}
//# sourceMappingURL=phone-number.helper.js.map