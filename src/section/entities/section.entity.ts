import { Branch } from 'src/branch/entities/branch.entity';
import { Student } from 'src/user/student/student.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { Revenue } from 'src/revenues/entities/revenues.entity';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
  
  @Column({ nullable: true })
  nameAr: string;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ type: 'float' })
  downPayment: number;

  
  @Column({ type: 'text', array: true, nullable: true })
  courses: string[];

  @ManyToMany(() => Branch, (branch) => branch.sections)
  branches: Branch[];

  @OneToMany(() => Student, (student) => student.section)
  students: Student[];

  @OneToMany(() => Lesson, (lesson) => lesson.section)
  lessons: Lesson[];

  @OneToMany(() => Revenue, (revenue) => revenue.section)
  revenues: Revenue[];
}
