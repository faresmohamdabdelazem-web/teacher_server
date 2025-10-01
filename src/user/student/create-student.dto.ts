import { 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsNumber, 
  Length 
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsBase64OrURL } from '../../decorators/isBase64OrURL.decorator';
import { IsULID as IsULIDValidator } from '../../decorators/is.ulid.decorator';

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
  section?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  @Length(14, 14, { message: 'National ID must be exactly 14 digits' })
  nationalId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  notes?: { text: string; createdAt?: Date }[];

  @IsOptional()
  @IsBase64OrURL()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  manualEntryId?: string;

  @IsOptional()
  @IsULIDValidator()
  id?: string;

  // 💰 المبلغ الكلي
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalAmount?: number;

  // 💵 المقدم
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  downPayment?: number;

  // 💵 باقي المقدم
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  remainingDownPayment?: number;

  // 👤 من خلال الشخص
  @IsOptional()
  @IsString()
  throughPerson?: string;

  // 🏦 مستلم النقدية
  @IsOptional()
  @IsString()
  cashReceiver?: string;

  // 🧾 رقم الإيصال
  @IsOptional()
  @IsString()
  receiptNumber?: string;
}
