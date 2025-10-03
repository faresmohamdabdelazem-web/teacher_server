import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Student } from 'src/user/student/student.entity';

export enum InstallmentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

@Entity('installments')
export class Installment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 0 })
  monthNumber: number;

  @Column({ type: 'int' })
  installmentNumber: number;

  @Column({ type: 'int' })
  installmentStage: number;

  @Column({ nullable: true })
  cashReceiver: string;

  @Column({ nullable: true })
  numberOfInstallment: string;

  @Column('float')
  amount: number;

  @Column('float', { default: 0 })
  amountPaid: number;

  @Column('float')
  remainingAmount: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: InstallmentStatus,
    default: InstallmentStatus.UNPAID,
  })
  status: InstallmentStatus;

  @Column({ type: 'jsonb', default: [] })
  paymentHistory: {
    amount: number;
    paidAt: Date;
    cashReceiver: string;
    receiptNumber: string;
  }[];

  @ManyToOne(() => Student, (student) => student.installments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  initializeInstallment() {
    this.remainingAmount = this.amount;
    this.setDueDate();
  }

  @BeforeUpdate()
  updateStatus() {
    if (this.remainingAmount <= 0) {
      this.status = InstallmentStatus.PAID;
      this.remainingAmount = 0;
    } else if (this.amountPaid > 0) {
      this.status = InstallmentStatus.PARTIALLY_PAID;
    } else {
      this.status = InstallmentStatus.UNPAID;
    }
  }

  setDueDate() {
    const now = new Date();
    // قسط المقدم يستحق فوراً
    if (this.monthNumber <= 0) {
      this.dueDate = now;
    } else {
      // --- تعديل مهم: تصحيح حساب تاريخ الاستحقاق ---
      // يضيف عدد الشهور (monthNumber) إلى الشهر الحالي
      this.dueDate = new Date(now.getFullYear(), now.getMonth() + this.monthNumber, 5);
      // ------------------------------------------
    }
  }
}