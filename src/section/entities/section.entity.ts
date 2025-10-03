import { Branch } from 'src/branch/entities/branch.entity';
import { Student } from 'src/user/student/student.entity'; // --- إضافة جديدة ---
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';

@Entity('sections')
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ type: 'float' })
  downPayment: number;

  @ManyToMany(() => Branch, (branch) => branch.sections)
  branches: Branch[];

  // --- بداية الإضافة: علاقة مع الطلاب ---
  @OneToMany(() => Student, (student) => student.section)
  students: Student[];
  // --- نهاية الإضافة ---
}