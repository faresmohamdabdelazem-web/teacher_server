import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Teacher } from '../../user/teacher/teacher.entity';

export enum StatsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

@Entity('teacher_stats')
export class TeacherStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  teacherId: string;

  @ManyToOne(() => Teacher)
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({
    type: 'enum',
    enum: StatsPeriod
  })
  period: StatsPeriod;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int', default: 0 })
  totalLessons: number;

  @Column({ type: 'int', default: 0 })
  totalStudents: number;

  @Column({ type: 'int', default: 0 })
  totalAttendance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageEarningsPerLesson: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageStudentsPerLesson: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRate: number;

  @Column({ type: 'int', default: 0 })
  completedLessons: number;

  @Column({ type: 'int', default: 0 })
  cancelledLessons: number;

  @Column({ type: 'int', default: 0 })
  expiredLessons: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 