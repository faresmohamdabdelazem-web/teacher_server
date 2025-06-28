import { IsNotEmpty, IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export class TeacherStatsDto {
  @IsNotEmpty()
  @IsUUID()
  teacherId: string;

  @IsNotEmpty()
  @IsEnum(StatsPeriod)
  period: StatsPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface TeacherStatsResponse {
  teacherId: string;
  period: StatsPeriod;
  totalLessons: number;
  totalStudents: number;
  totalAttendance: number;
  totalEarnings: number;
  averageEarningsPerLesson: number;
  averageStudentsPerLesson: number;
  completionRate: number;
  lessons: Array<{
    date: string;
    count: number;
  }>;
  students: Array<{
    date: string;
    count: number;
  }>;
  attendance: Array<{
    date: string;
    count: number;
  }>;
  earnings: Array<{
    date: string;
    amount: number;
  }>;
} 