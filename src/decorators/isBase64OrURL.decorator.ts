import {
  ValidationOptions,
  ValidateBy,
  buildMessage,
  isBase64,
  isURL,
} from 'class-validator';
const IS_BASE64_OR_URL = 'IS_BASE64_OR_URL';

export function IsBase64OrURL(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_BASE64_OR_URL,
      validator: {
        validate: (value) => isURL(value) || isBase64(value),
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property is not valid base64 or url',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
