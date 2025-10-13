import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Branch } from 'src/branch/entities/branch.entity'; // ✅ تأكد من المسار الصحيح

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

  // ✅ العلاقة الجديدة مع الفرع
  @Column('uuid', { nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.assistants, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
