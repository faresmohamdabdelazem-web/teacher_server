import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum PaymentType {
  PARTIAL = 'PARTIAL_PAYMENT',
  FULL = 'FULL_INSTALLMENT',
  DOWN_PAYMENT = 'DOWN_PAYMENT',
}

export class PayInstallmentDto {
  @IsNotEmpty()
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

  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;



  @IsOptional()
  @IsString()
  throughPerson:string
}