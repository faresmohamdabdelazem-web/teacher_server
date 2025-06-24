import { IsNotEmpty, IsUUID } from 'class-validator';

export class UnsubscribeLessonDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  lessonId: string;
} 