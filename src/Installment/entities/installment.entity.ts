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
  AfterLoad,
  OneToMany,
} from 'typeorm';
import { Student } from 'src/user/student/student.entity';
import { Revenue } from 'src/revenues/entities/revenues.entity';
// 🔹 Import PaymentType to be used in paymentHistory
import { PaymentType } from '../dto/pay-installment.dto';

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


  @Column({ nullable: true })
  throughPerson: string

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

  // 🔹 ADDED: paymentHistory is now part of the Installment
  @Column({ type: 'jsonb', default: [] })
  paymentHistory: {
    amount: number;
    paidAt: Date;
    cashReceiver: string;
    receiptNumber: string;
    paymentType: PaymentType;
    throughPerson:string;
  }[];

  @ManyToOne(() => Student, (student) => student.installments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;


  @OneToMany(() => Revenue, (revenue) => revenue.installment)
  revenues: Revenue[];
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
    if (this.monthNumber <= 0) {
      this.dueDate = now;
    } else {
      this.dueDate = new Date(now.getFullYear(), now.getMonth() + this.monthNumber, 5);
    }
  }
}