import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { Installment } from 'src/Installment/entities/installment.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { Section } from 'src/section/entities/section.entity'; // --- إضافة جديدة ---

@Entity('students')
export class Student {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id: string;

  // ... (firstName, lastName, etc. remain the same)
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  whatsapp?: string;

  @Column({ type: 'varchar', nullable: true })
  parentPhoneNumber?: string;
  
  // --- تم حذف الحقل النصي القديم للقسم ---

  @Column({ nullable: true })
  grade?: string;

  @Column({ nullable: true })
  nationalId?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  notes: { text: string; descroption:string ;createdAt: Date }[];

  @Column({ nullable: true })
  profilePhoto?: string;

  @Column({ unique: true, nullable: true })
  manualEntryId: string;

  @Column({ type: 'int', default: 0 })
  installmentStage: number;

  @Column({ type: 'float', nullable: true })
  totalAmount?: number;

  @Column({ type: 'float', nullable: true })
  downPayment?: number;

  @Column({ type: 'float', nullable: true })
  remainingDownPayment?: number;

  @Column({ type: 'float', default: 0 })
  paidAmount: number;

  @Column({ type: 'float', nullable: true })
  remainingBalance: number;

  @Column({ type: 'varchar', nullable: true })
  throughPerson?: string;

  @ManyToOne(() => Branch, (branch) => branch.students, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  // --- بداية التعديل: إضافة علاقة مع القسم ---
  @ManyToOne(() => Section, (section) => section.students, { eager: true }) // eager لجلب القسم مع الطالب دائمًا
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @Column({ type: 'uuid', nullable: true })
  sectionId: string;
  // --- نهاية التعديل ---

  @Column({ type: 'varchar', nullable: true })
  cashReceiver?: string;

  @Column({ nullable: true })
  receiptNumber?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Teacher, (teacher) => teacher.students)
  teachers: Teacher[];

  @ManyToMany(() => Lesson, (lesson) => lesson.students)
  lessons: Lesson[];

  @OneToMany(() => Installment, (installment) => installment.student, {
    cascade: true,
  })
  installments: Installment[];
}