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

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string

  @Column({ unique: true, nullable: true })
  nameAr: string

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @OneToMany(() => Student, (student) => student.branch)
  students: Student[];

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
}
