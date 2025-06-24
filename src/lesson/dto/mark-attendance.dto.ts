import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AttendanceStatus } from '../entities/lesson-attendance.entity';

export class MarkAttendanceDto {
  @IsNotEmpty()
  @IsUUID()
  lessonId: string;

  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
} 