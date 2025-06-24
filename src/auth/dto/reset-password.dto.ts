import { IsNotEmpty, IsNumberString, IsString, Length } from 'class-validator';
import { HashPassword } from 'src/decorators/password/hash.password.decorator';

export class ResetPasswordDto {
  @IsNumberString()
  @Length(4, 4)
  otp: string;

  @IsString()
  @IsNotEmpty()
  @HashPassword()
  newPassword: string;
}
