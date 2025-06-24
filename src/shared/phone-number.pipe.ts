import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  assignPlusToNumber,
  makePhoneObject,
} from 'src/shared/phone-number.helper';

@Injectable()
export class PhoneNumberPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (value) {
      const object = plainToInstance(metadata.metatype, value);
      if (object.phone) {
        object.phone = makePhoneObject(assignPlusToNumber(object.phone));
      }
      return plainToInstance(metadata.metatype, object);
    }

    return value;
  }
}
