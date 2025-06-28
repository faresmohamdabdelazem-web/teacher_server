import { IsNotEmpty, IsUUID } from 'class-validator';
import { IsULID } from 'src/decorators/is.ulid.decorator';

export class TransferStudentDto {
  @IsNotEmpty()
  @IsULID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  toLessonId: string;
} 