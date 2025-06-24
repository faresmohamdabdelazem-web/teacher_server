import { IsJWT, IsOptional } from 'class-validator';

export class CheckJwtDto {
  @IsJWT()
  token: string;
}
 