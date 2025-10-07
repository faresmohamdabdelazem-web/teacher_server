import { Branch } from 'src/branch/entities/branch.entity';
import { Student } from 'src/user/student/student.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity'; // ← أضف هذا
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
  
  @Column({  nullable: true })
  nameAr: string;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ type: 'float' })
  downPayment: number;

  @ManyToMany(() => Branch, (branch) => branch.sections)
  branches: Branch[];

  // علاقة مع الطلاب
  @OneToMany(() => Student, (student) => student.section)
  students: Student[];

  // علاقة مع المحاضرات
  @OneToMany(() => Lesson, (lesson) => lesson.section)
  lessons: Lesson[];
}
