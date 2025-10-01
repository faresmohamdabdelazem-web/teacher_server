import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from 'src/user/student/student.entity';

@Entity('installments')
export class Installment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: "numeric", default: 0 })
  monthNumber: number

  @Column({ nullable: true })
  cashReceiver: string;

  @Column('numeric')
  amount: number;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ default: false })
  isPaid: boolean;

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
}
