import { PaginatedRequestDto } from 'src/shared/dto/paginated-req.dto';
import { UserRole } from '../user.role.enum';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsPhoneNumberStringOrNumber } from 'src/decorators/isPhoneNumber';

export class FilterUsersDto extends PaginatedRequestDto {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value.toString() == 'true', { toClassOnly: true })
  verify: boolean;

  @IsEnum(UserRole)
  @IsOptional()
  role: UserRole;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @IsPhoneNumberStringOrNumber()
  @IsOptional()
  phone?: string;
}
