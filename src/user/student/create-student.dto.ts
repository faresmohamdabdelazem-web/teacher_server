import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { IsULID } from '../../decorators/is.ulid.decorator';
import { IsBase64OrURL } from '../../decorators/isBase64OrURL.decorator';

export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  parentPhoneNumber?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsULID()
  id?: string;

  @IsOptional()
  @IsBase64OrURL()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  manualEntryId?: string;
} 