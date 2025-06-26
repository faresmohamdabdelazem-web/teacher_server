import { Entity, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne, Column } from 'typeorm';
import { User } from '../entities/user.entity';
import { Teacher } from '../teacher/teacher.entity';

@Entity('assistants')
export class Assistant {
  @PrimaryColumn('uuid')
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid', { nullable: true })
  teacherId: string;

  @ManyToOne(() => Teacher, { nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 