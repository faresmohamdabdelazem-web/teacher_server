import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Teacher } from '../../user/teacher/teacher.entity';
import { Student } from '../../user/student/student.entity';
// import { Assistant } from '../../user/assistant/assistant.entity';

export enum LessonRecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum LessonStatus {
  SCHEDULED = 'scheduled',
  ATTENDANCE_OPEN = 'attendance_open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  subject: string;

  @Column({ type: 'date', nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  startTime: Date; // Actual lesson start time

  @Column({ nullable: true })
  endTime: Date; // Actual lesson end time

  @Column({ nullable: true })
  attendanceStartTime: Date; // When attendance can be taken (1 hour before start)

  @Column({ nullable: true })
  room: string;

  @Column({ 
    type: 'enum', 
    enum: LessonRecurrenceType, 
    default: LessonRecurrenceType.NONE 
  })
  recurrenceType: LessonRecurrenceType;

  @Column({ type: 'json', nullable: true })
  recurrencePattern: any; // e.g., { dayOfWeek: 3 } for Wednesday

  @Column({ 
    type: 'enum', 
    enum: LessonStatus, 
    default: LessonStatus.SCHEDULED 
  })
  status: LessonStatus;inutes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with Teacher
  @Column()
  teacherId: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.lessons)
  teacher: Teacher;

  // Relationship with Students
  @ManyToMany(() => Student, (student) => student.lessons)
  @JoinTable({
    name: 'lesson_students',
    joinColumn: { name: 'lessonId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  students: Student[];

  // Removed assistants relation

  @Column({ type: 'decimal', nullable: true })
  price: number;

  @Column({ nullable: true })
  grade?: string;
} 