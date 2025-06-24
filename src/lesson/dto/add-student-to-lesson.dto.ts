import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddStudentToLessonDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  lessonId: string;
} 