import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty({ message: 'اسم القسم لا يمكن أن يكون فارغًا.' })
name: string;
@IsNumber()
@IsPositive({ message: 'إجمالي المصروفات يجب أن يكون رقمًا موجبًا.' })
totalAmount: number;
@IsNumber()
@Min(0, { message: 'المقدم لا يمكن أن يكون رقمًا سالبًا.' })
downPayment: number;
}