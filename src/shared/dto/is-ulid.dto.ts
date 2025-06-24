import { IsULID } from 'src/decorators/is.ulid.decorator';

export class IdDto {
  @IsULID()
  id: string;
}
