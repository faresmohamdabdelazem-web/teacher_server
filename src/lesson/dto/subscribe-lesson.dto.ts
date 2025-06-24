import { IsNotEmpty, IsUUID } from 'class-validator';

export class SubscribeLessonDto {
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsUUID()
  lessonId: string;
} 