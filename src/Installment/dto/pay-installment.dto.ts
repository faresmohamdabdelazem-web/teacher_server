import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class PayInstallmentDto {

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'Payment amount must be greater than zero.' })
  amount: number;

  
  @IsNotEmpty()
  @IsString()
  cashReceiver: string;
}