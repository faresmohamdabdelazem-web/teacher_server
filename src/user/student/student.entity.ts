import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { User } from '../entities/user.entity';

@Entity('students')
export class Student {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'id' })
  user: User;

  @Column({ nullable: true })
  parentPhoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with Teachers
  @ManyToMany(() => Teacher, (teacher) => teacher.students)
  teachers: Teacher[];

  // Relationship with Lessons
  @ManyToMany(() => Lesson, (lesson) => lesson.students)
  lessons: Lesson[];
} 