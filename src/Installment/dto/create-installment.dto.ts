import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInstallmentDto {
  @IsNotEmpty()
  @IsNumber()
  monthNumber: number;


  @IsBoolean()
  isPaid?: boolean;

  @IsNotEmpty()
  @IsNumber()
  installmentNumber: number; // ← خليها number زي الـ Entity

  @IsNotEmpty()
  @IsNumber()
  amount: number; // مبلغ القسط

  @IsOptional()
  @IsNumber()
  installmentStage?: number; // المرحلة

  @IsNotEmpty()
  @IsString()
  cashReceiver: string;

  @IsNotEmpty()
  @IsString()
  studentId: string; // ID الطالب
}
