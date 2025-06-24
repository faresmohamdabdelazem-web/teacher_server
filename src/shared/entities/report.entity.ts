import {
  BaseEntity,
  BeforeInsert,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';

export class BaseReport extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @BeforeInsert()
  generateId() {
    this.id = ulid();
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
