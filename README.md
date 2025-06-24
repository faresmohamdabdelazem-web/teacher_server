<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

## Entity Structures

### Teacher Entity (`src/user/teacher/teacher.entity.ts`)

```typescript
@Entity('teachers')
export class Teacher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with User (for authentication)
  @Column({ nullable: true })
  userId: string;

  @OneToMany(() => Lesson, (lesson) => lesson.teacher)
  lessons: Lesson[];

  @ManyToMany(() => Student, (student) => student.teachers)
  @JoinTable({
    name: 'teacher_students',
    joinColumn: { name: 'teacherId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  students: Student[];
}
```

**Database Schema:**
- `teachers` table with UUID primary key
- One-to-many relationship with lessons
- Many-to-many relationship with students via `teacher_students` junction table
- Links to user authentication via `userId` field

### Lesson Entity (`src/lesson/entities/lesson.entity.ts`)

```typescript
@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  subject: string;

  @Column({ type: 'date', nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column({ nullable: true })
  room: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with Teacher
  @Column()
  teacherId: string;

  @ManyToOne(() => Teacher, (teacher) => teacher.lessons)
  teacher: Teacher;

  // Relationship with Students
  @ManyToMany(() => Student, (student) => student.lessons)
  @JoinTable({
    name: 'lesson_students',
    joinColumn: { name: 'lessonId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'studentId', referencedColumnName: 'id' },
  })
  students: Student[];

  // Relationship with Assistants
  @ManyToMany(() => Assistant, (assistant) => assistant.lessons)
  @JoinTable({
    name: 'lesson_assistants',
    joinColumn: { name: 'lessonId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'assistantId', referencedColumnName: 'id' },
  })
  assistants: Assistant[];
}
```

**Database Schema:**
- `lessons` table with UUID primary key
- Many-to-one relationship with teacher (required)
- Many-to-many relationship with students via `lesson_students` junction table
- Many-to-many relationship with assistants via `lesson_assistants` junction table
- Supports scheduling with date, start time, end time, and room information

### Student Entity (`src/user/student/student.entity.ts`)

```typescript
@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  parentPhoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with Teachers
  @ManyToMany(() => Teacher, (teacher) => teacher.students)
  teachers: Teacher[];

  // Relationship with Lessons
  @ManyToMany(() => Lesson, (lesson) => lesson.students)
  lessons: Lesson[];
}
```

**Database Schema:**
- `students` table with UUID primary key
- Many-to-many relationship with teachers via `teacher_students` junction table
- Many-to-many relationship with lessons via `lesson_students` junction table
- Includes parent contact information via `parentPhoneNumber`

### Assistant Entity (`src/user/assistant/assistant.entity.ts`)

```typescript
@Entity('assistants')
export class Assistant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationship with User (for authentication)
  @Column({ nullable: true })
  userId: string;

  // Relationship with Lessons
  @ManyToMany(() => Lesson, (lesson) => lesson.assistants)
  @JoinTable({
    name: 'lesson_assistants',
    joinColumn: { name: 'assistantId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lessonId', referencedColumnName: 'id' },
  })
  lessons: Lesson[];
}
```

**Database Schema:**
- `assistants` table with UUID primary key
- Many-to-many relationship with lessons via `lesson_assistants` junction table
- Links to user authentication via `userId` field
- Unique email constraint

### Key Relationships Summary

1. **Teacher ↔ Lesson**: One-to-many (one teacher can have many lessons)
2. **Teacher ↔ Student**: Many-to-many (teachers can have multiple students, students can have multiple teachers)
3. **Lesson ↔ Student**: Many-to-many (lessons can have multiple students, students can attend multiple lessons)
4. **Lesson ↔ Assistant**: Many-to-many (lessons can have multiple assistants, assistants can help with multiple lessons)
5. **User Authentication**: All entities (Teacher, Assistant) link to the main User entity for authentication via `userId` field

### Junction Tables

- `teacher_students`: Links teachers and students
- `lesson_students`: Links lessons and students
- `lesson_assistants`: Links lessons and assistants
