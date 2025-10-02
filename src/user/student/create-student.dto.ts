import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Length,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsBase64OrURL } from '../../decorators/isBase64OrURL.decorator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  parentPhoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  section: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsNotEmpty()
  @IsString()
  @Length(14, 14, { message: 'National ID must be exactly 14 digits' })
  nationalId: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsUUID('4', { message: 'Branch ID must be a valid UUID.' })
  branchId: string;

  @IsOptional()
  notes?: {title: string;descroption:string ;createdAt?: Date }[];

  @IsOptional()
  @IsBase64OrURL()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  manualEntryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  downPayment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  remainingDownPayment?: number;

  @IsOptional()
  @IsString()
  throughPerson?: string;

  @IsOptional()
  @IsString()
  cashReceiver?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;
}