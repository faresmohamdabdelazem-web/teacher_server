import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
} from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { ulid } from 'ulid';

@Entity('students')
export class Student {
  @PrimaryColumn()
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  parentPhoneNumber?: string;

  @Column({ nullable: true })
  grade?: string;

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

  @BeforeInsert()
  generateId() {
    this.id = ulid();
  }
} 