import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
export class FilterAssetsDto {
  @IsBoolean()
  @Transform(({ value }) => value.toString() == 'true', { toClassOnly: true })
  withStates: boolean;

  @IsOptional()
  @IsString()
  iso2?: string;
}
