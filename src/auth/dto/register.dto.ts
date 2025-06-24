import {
  IsEmail,
  IsString,
  IsOptional,
  Length,
  IsNotEmpty,
  IsDateString,
  IsBase64,
  IsISO31661Alpha2,
  IsPostalCode,
  IsEnum,
} from 'class-validator';
import { IsPhoneNumberStringOrNumber } from 'src/decorators/isPhoneNumber';
import { HashPassword } from 'src/decorators/password/hash.password.decorator';
import { UserRole } from 'src/user/user.role.enum';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8)
  @HashPassword()
  password: string;

  @IsString()
  @Length(0, 50)
  firstName: string;

  @IsString()
  @Length(0, 50)
  lastName: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsPhoneNumberStringOrNumber()
  @IsOptional()
  phone?: string;


}
