import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { Student } from '../student/student.entity';
import { User } from '../entities/user.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Lesson, (lesson) => lesson.teacher)
  lessons: Lesson[];

  @ManyToMany(() => Student, (student) => student.teachers)
  @JoinTable({
    name: 'teacher_students',
    joinColumn: { name: 'teacherId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  students: Student[];
} 