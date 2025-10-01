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
} from 'typeorm';
import { ulid } from 'ulid';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../user.role.enum';

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

  @Column('enum', {
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;
}
