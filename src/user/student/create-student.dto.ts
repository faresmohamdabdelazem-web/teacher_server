import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Length,
  IsUUID,
  IsArray,
  ValidateNested, // 🔹 لاستخدامه في التحقق من صحة الكائنات داخل المصفوفة
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsBase64OrURL } from '../../decorators/isBase64OrURL.decorator';

// 🔹👇 هذا هو تعريف الـ DTO الخاص بالـ Activity
class ActivityDto {
  @IsString()
  title: string;

  @IsString()
  subTitle: string;

  @Type(() => Date)
  createdAt?: Date;
}

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

  @IsNotEmpty()
  @IsUUID('4', { message: 'Sectio ID must be a valid UUID.' })
  sectionId: string;

  @IsOptional()
  notes?: { title: string; descroption: string; createdAt?: Date }[];

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

  // 🔹👇 تم تحديث هذا الجزء
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // للتحقق من كل عنصر في المصفوفة
  @Type(() => ActivityDto) // لتحديد نوع العناصر داخل المصفوفة
  activities?: ActivityDto[];
}