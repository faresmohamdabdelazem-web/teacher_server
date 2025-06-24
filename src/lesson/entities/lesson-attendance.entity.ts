import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lesson } from './lesson.entity';
import { Student } from '../../user/student/student.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Entity('lesson_attendance')
export class LessonAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lessonId: string;

  @Column()
  studentId: string;

  @Column({ 
    type: 'enum', 
    enum: AttendanceStatus, 
    default: AttendanceStatus.ABSENT 
  })
  status: AttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  attendanceTime: Date; // When the student was marked present

  @Column({ type: 'text', nullable: true })
  notes: string; // Additional notes from teacher/assistant

  @Column({ nullable: true })
  markedBy: string; // ID of teacher/assistant who marked attendance

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Lesson, (lesson) => lesson.id)
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @ManyToOne(() => Student, (student) => student.id)
  @JoinColumn({ name: 'studentId' })
  student: Student;
} 