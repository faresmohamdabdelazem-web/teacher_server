import {
  IsEmail,
  IsString,
  IsOptional,
  Length,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsISO31661Alpha2,
  IsPostalCode,
} from 'class-validator';
import { UserRole } from '../user.role.enum';
import { HashPassword } from 'src/decorators/password/hash.password.decorator';
import { IsBase64OrURL } from 'src/decorators/isBase64OrURL.decorator';
import { IsPhoneNumberStringOrNumber } from 'src/decorators/isPhoneNumber';

export class CreateUserDto {

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(0, 64)
  firstName: string;

  @IsString()
  @Length(0, 64)
  lastName: string;

  @IsString()
  @HashPassword()
  password?: string;

  @IsEnum(UserRole)
  role: UserRole;


  @IsOptional()
  phone?: string;
  
}
