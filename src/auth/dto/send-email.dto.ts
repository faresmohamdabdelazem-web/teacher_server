import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsBoolean()
  @IsNotEmpty()
  ar: boolean;
}
