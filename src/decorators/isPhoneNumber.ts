import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';
import {
  assignPlusToNumber,
  isValidPhoneNumber,
} from 'src/shared/phone-number.helper';

const IS_PHONE_NUMBER = 'IS_PHONE_NUMBER_ENHANCED';

/**
 * Decorator to checks if the field is a valid phoneNumber.
 */
export function IsPhoneNumberStringOrNumber(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_PHONE_NUMBER,
      validator: {
        validate: (value) => {
          if (typeof value == 'string') {
            return isValidPhoneNumber(assignPlusToNumber(value));
          }
          if (typeof value == 'number') {
            return isValidPhoneNumber(assignPlusToNumber(value));
          }
          return false;
        },
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property is not valid phone number',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
