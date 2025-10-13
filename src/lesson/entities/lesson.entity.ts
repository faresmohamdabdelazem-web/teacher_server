import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany, // 🔹 تأكد من استيراد OneToMany
} from 'typeorm';
import { Teacher } from '../../user/teacher/teacher.entity';
import { Student } from '../../user/student/student.entity';
import { Section } from 'src/section/entities/section.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { LessonAttendance } from './lesson-attendance.entity'; // 🔹 استيراد كيان الحضور

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
  EXPIRED = 'expired',
}

export enum PricingType {
  PER_LESSON = 'per_lesson',
  MONTHLY = 'monthly',
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

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  attendanceStartTime: Date;

  @Column({ nullable: true })
  room: string;
  @Column({ nullable: true })
  teachername: string;

  @Column({
    type: 'enum',
    enum: LessonRecurrenceType,
    default: LessonRecurrenceType.NONE,
  })
  recurrenceType: LessonRecurrenceType;

  @Column({ type: 'json', nullable: true })
  recurrencePattern: any;

  @Column({
    type: 'enum',
    enum: LessonStatus,
    default: LessonStatus.SCHEDULED,
  })
  status: LessonStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  teacherId: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.lessons)
  teacher: Teacher;

  @ManyToMany(() => Student, (student) => student.lessons)
  @JoinTable({
    name: 'lesson_students',
    joinColumn: { name: 'lessonId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  students: Student[];

  @Column({ nullable: true })
  sectionId: string;

  @ManyToOne(() => Section, (section) => section.lessons, {
    onDelete: 'SET NULL',
  })
  section: Section;

  @ManyToOne(() => Branch, (branch) => branch.lessons)
  branch: Branch;
  
  // ✅👇 هذا هو الجزء الذي تمت إضافته وتصحيحه
  @OneToMany(() => LessonAttendance, (attendance) => attendance.lesson)
  attendances: LessonAttendance[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({
    type: 'enum',
    enum: PricingType,
    default: PricingType.PER_LESSON,
  })
  pricingType: PricingType;

  @Column({ nullable: true })
  grade?: string;

  nameAr: any;
  branches: any;
}