import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  Index,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Branch } from 'src/branch/entities/branch.entity';
import { ulid } from 'ulid';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../user.role.enum';
import { Teacher } from '../teacher/teacher.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  // @BeforeInsert()
  // generateId() {
  //   this.id = ulid();
  // }

  @Column({ unique: true })
  @Index('idx_user_email')
  email: string;

  @Column({ length: 64 })
  firstName: string;

  @Column({ length: 64 })
  lastName: string;

  @Column({ nullable: true, length: 64 })
  phone?: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ nullable: true, unique: true })
  @Exclude()
  otpToken?: string;

  @Column({ type: 'bigint', nullable: true })
  @Exclude()
  otpExp?: number;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;
// ✅ أضف العلاقة دي:
  @OneToOne(() => Teacher, (teacher) => teacher.user)
  teacher: Teacher;
  @Column('enum', {
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;



    // ✅ ربط المستخدم بالفرع
  @ManyToOne(() => Branch, (branch) => branch.users, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;
}
