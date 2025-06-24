export declare function isValidPhoneNumber(number: string): boolean;
export declare function extractCountryCodeFromNumber(number: string): import("libphonenumber-js").CountryCode;
export declare function extractDialCodeFromNumber(number: string): number;
export declare function assignPlusToNumber(number: string | number): string;
export declare function formatPhone(number: string): string;
export declare function makePhoneObject(phone: string): {
    phoneNumber: string;
    countryCode: import("libphonenumber-js").CountryCode;
    dialCode: number;
};
