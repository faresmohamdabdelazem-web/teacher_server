import { IsNotEmpty, IsUUID } from 'class-validator';

export class StartAttendanceDto {
  @IsNotEmpty()
  @IsUUID()
  lessonId: string;
} 