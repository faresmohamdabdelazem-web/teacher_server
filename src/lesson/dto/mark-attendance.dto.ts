import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AttendanceStatus } from '../entities/lesson-attendance.entity';
import { IsULID } from '../../decorators/is.ulid.decorator';

export class MarkAttendanceDto {
  @IsNotEmpty()
  @IsString()
  lessonId: string;

  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
} 