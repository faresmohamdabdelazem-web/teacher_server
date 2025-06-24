import { isValidNumber, parsePhoneNumber } from 'libphonenumber-js';

export function isValidPhoneNumber(number: string) {
  try {
    return isValidNumber(number);
  } catch (error) {
    return undefined;
  }
}

export function extractCountryCodeFromNumber(number: string) {
  try {
    const parsedNumber = parsePhoneNumber(number);
    return parsedNumber.country;
  } catch (error) {
    return undefined;
  }
}

export function extractDialCodeFromNumber(number: string) {
  try {
    const parsedNumber = parsePhoneNumber(number);
    return +parsedNumber.countryCallingCode;
  } catch (error) {
    return undefined;
  }
}

export function assignPlusToNumber(number: string | number) {
  const parsedNumber = parseInt(number as string);
  return `+${parsedNumber}`;
}

export function formatPhone(number: string) {
  try {
    const phone = parsePhoneNumber(number);
    const INTERNATIONAL = phone.format('INTERNATIONAL');
    console.log(INTERNATIONAL);

    let formatted = '';
    for (let c = INTERNATIONAL.indexOf(' '); c < INTERNATIONAL.length; c++) {
      if (INTERNATIONAL.charAt(c) !== ' ') {
        formatted += INTERNATIONAL.charAt(c);
      }
    }
    return formatted;
  } catch (error) {
    return undefined;
  }
}

export function makePhoneObject(phone: string) {
  return {
    phoneNumber: formatPhone(assignPlusToNumber(phone)),
    countryCode: extractCountryCodeFromNumber(assignPlusToNumber(phone)),
    dialCode: extractDialCodeFromNumber(assignPlusToNumber(phone)),
  };
}
