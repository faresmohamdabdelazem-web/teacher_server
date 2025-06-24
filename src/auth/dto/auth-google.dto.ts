import { IsJWT } from 'class-validator';

export class SocialLoginDto {
  @IsJWT()
  idToken: string;
}
