import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Student } from 'src/user/student/student.entity';
import { Section } from 'src/section/entities/section.entity';
import { Revenue } from 'src/revenues/entities/revenues.entity';
import { Lesson } from 'src/lesson/entities/lesson.entity';
import { Assistant } from 'src/user/assistant/assistant.entity'; // ✅ تأكد من المسار الصحيح
import { User } from 'src/user/entities/user.entity';
@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true, nullable: true })
  nameAr: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => Student, (student) => student.branch)
  students: Student[];

  @OneToMany(() => Revenue, (revenue) => revenue.branch)
  revenues: Revenue[];

  // ✅ العلاقة الجديدة مع المساعدين
  @OneToMany(() => Assistant, (assistant) => assistant.branch)
  assistants: Assistant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Section, (section) => section.branches)
  @JoinTable({
    name: 'branch_sections',
    joinColumn: { name: 'branchId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'sectionId', referencedColumnName: 'id' },
  })
  sections: Section[];

   @OneToMany(() => Lesson, (lesson) => lesson.branch)
  lessons: Lesson[];

  @OneToMany(() => User, (user) => user.branch)
users: User[];
}
