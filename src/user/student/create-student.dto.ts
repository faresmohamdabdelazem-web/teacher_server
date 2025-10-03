import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Length,
  IsUUID,
  Min,
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
  
  @IsNotEmpty()
  @IsString()
  @Length(14, 14, { message: 'National ID must be exactly 14 digits' })
  nationalId: string;
  
  @IsNotEmpty()
  @IsUUID('4', { message: 'Branch ID must be a valid UUID.' })
  branchId: string;

  // --- بداية التعديل ---
  @IsNotEmpty()
  @IsUUID('4', { message: 'Section ID must be a valid UUID.' })
  sectionId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paidDownPayment?: number; // المبلغ المدفوع من المقدم عند التسجيل
  // --- تم حذف totalAmount و downPayment من هنا ---
  // --- نهاية التعديل ---

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  parentPhoneNumber?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  notes?: {title: string;descroption:string ;createdAt?: Date }[];

  @IsOptional()
  @IsBase64OrURL()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  manualEntryId?: string;

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