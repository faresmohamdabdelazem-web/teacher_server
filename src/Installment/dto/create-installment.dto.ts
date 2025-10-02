import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateInstallmentDto {
  @IsNotEmpty()
  @IsNumber()
  monthNumber: number;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsDate()
  paidAt: Date | null;

  @IsNotEmpty()
  @IsString()
  cashReceiver: string;

  @IsNotEmpty()
  @IsString()
  studentId: string;
}