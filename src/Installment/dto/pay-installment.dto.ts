import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PayInstallmentDto {
  @IsOptional()
  @IsNumber()
  installmentNumber: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'المبلغ المدفوع يجب ان يكون اكبر من الصفر' })
  amount: number;

  @IsNotEmpty()
  @IsString()
  cashReceiver: string;

  @IsNotEmpty()
  @IsString()
  receiptNumber: string;
}