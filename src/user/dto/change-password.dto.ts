import { IsString, Length } from 'class-validator';
import { HashPassword } from 'src/decorators/password/hash.password.decorator';

export class ChangePasswordDto {
  @IsString()
  @Length(8, 15)
  oldPassword: string;

  @IsString()
  @Length(8, 15)
  @HashPassword()
  newPassword: string;
}
