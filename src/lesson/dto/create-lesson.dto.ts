import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID, IsDateString, IsEnum, IsObject } from 'class-validator';
import { LessonRecurrenceType, LessonStatus } from '../entities/lesson.entity';

interface RecurrencePattern {
  dayOfWeek?: number;
}

export class CreateLessonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsOptional()
  @IsNumber()
  duration?: number; // in minutes

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string; // Actual lesson start time (ISO 8601 string)

  @IsOptional()
  @IsDateString()
  endTime?: string; // Actual lesson end time (ISO 8601 string)

  @IsOptional()
  @IsString()
  room?: string;

  @IsNotEmpty()
  @IsUUID()
  teacherId: string;

  @IsOptional()
  @IsEnum(LessonRecurrenceType)
  recurrenceType?: LessonRecurrenceType;

  @IsOptional()
  @IsObject()
  recurrencePattern?: RecurrencePattern; // e.g., { dayOfWeek: 3 } for Wednesday

  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;
} 