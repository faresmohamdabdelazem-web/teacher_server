import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';
import { Lesson } from '../../lesson/entities/lesson.entity';
import { Installment } from 'src/Installment/entities/installment.entity';
import { ulid } from 'ulid';

@Entity('students')
export class Student {
  @PrimaryColumn()
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  whatsapp?: string;

  @Column({ type: 'varchar', nullable: true })
  parentPhoneNumber?: string;

  @Column({ nullable: true })
  section?: string;

  @Column({ nullable: true })
  grade?: string;



  @Column({ nullable: true })
  nationalId?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  branchId?: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  notes: { text: string; createdAt: Date }[];

  @Column({ nullable: true })
  profilePhoto?: string;

  @Column({ unique: true, nullable: true })
  manualEntryId: string;

  @Column({ type: 'int', default: 0 })
  installmentStage: number;
  //  المبلغ الكلي
  @Column({ type: 'float', nullable: true })
  totalAmount?: number;

  //  المقدم
  @Column({ type: 'float', nullable: true })
  downPayment?: number;

  //  باقي المقدم
  @Column({ type: 'float', nullable: true })
  remainingDownPayment?: number;

  //  من خلال الشخص
  @Column({ type: 'varchar', nullable: true })
  throughPerson?: string;

  @Column({ type: 'varchar', nullable: true })
  cashReceiver?: string;

  //  رقم الإيصال
  @Column({ nullable: true })
  receiptNumber?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with Teachers
  @ManyToMany(() => Teacher, (teacher) => teacher.students)
  teachers: Teacher[];


  @ManyToMany(() => Lesson, (lesson) => lesson.students)
  lessons: Lesson[];


  @OneToMany(() => Installment, (installment) => installment.student, {
    cascade: true,
  })
  installments: Installment[];

  @BeforeInsert()
  generateId() {
    this.id = ulid();
  }
}
