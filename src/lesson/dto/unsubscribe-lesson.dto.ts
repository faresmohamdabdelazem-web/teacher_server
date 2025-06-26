import { IsNotEmpty, IsUUID } from 'class-validator';
import { IsULID } from '../../decorators/is.ulid.decorator';

export class UnsubscribeLessonDto {
  @IsNotEmpty()
  @IsULID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  lessonId: string;
} 