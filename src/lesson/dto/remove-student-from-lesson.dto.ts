import { IsNotEmpty, IsUUID } from 'class-validator';

export class RemoveStudentFromLessonDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  lessonId: string;
} 