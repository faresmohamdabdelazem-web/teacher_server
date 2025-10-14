import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Student } from 'src/user/student/student.entity';
import { Section } from 'src/section/entities/section.entity';
import { Installment } from 'src/Installment/entities/installment.entity';
import { Branch } from 'src/branch/entities/branch.entity';

export enum RevenueSource {
  DOWN_PAYMENT = 'DOWN_PAYMENT',
  INSTALLMENT = 'INSTALLMENT',
}

@Entity('revenues')
export class Revenue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  amount: number;

  @Column({
    type: 'enum',
    enum: RevenueSource,
  })
  source: RevenueSource;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.revenues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;
@ManyToOne(() => Branch, (branch) => branch.revenues, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

    @Column({ nullable: true })
  branchId: string;

  @ManyToOne(() => Section, (section) => section.revenues, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @Column({ nullable: true })
  sectionId: string;

  @ManyToOne(() => Installment, (installment) => installment.revenues, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'installmentId' })
  installment: Installment;

  @Column({ nullable: true })
  installmentId: string;
}