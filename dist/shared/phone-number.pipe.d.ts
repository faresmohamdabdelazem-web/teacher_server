import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class PhoneNumberPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata): Promise<any>;
}
