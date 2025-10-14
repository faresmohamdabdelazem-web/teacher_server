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
    default: AttendanceStatus.ABSENT,
  })
  status: AttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  attendanceTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  markedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ✅👇 تم تصحيح هذا الجزء
  @ManyToOne(() => Lesson, (lesson) => lesson.attendances)
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  // ✅👇 وتم تصحيح هذا الجزء أيضًا
  @ManyToOne(() => Student, (student) => student.attendances)
  @JoinColumn({ name: 'studentId' })
  student: Student;
}