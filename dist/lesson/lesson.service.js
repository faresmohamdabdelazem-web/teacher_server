"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lesson_entity_1 = require("./entities/lesson.entity");
const lesson_attendance_entity_1 = require("./entities/lesson-attendance.entity");
const teacher_entity_1 = require("../user/teacher/teacher.entity");
const student_entity_1 = require("../user/student/student.entity");
const user_service_1 = require("../user/user.service");
const user_role_enum_1 = require("../user/user.role.enum");
const typeorm_3 = require("typeorm");
let LessonService = class LessonService {
    constructor(lessonRepository, attendanceRepository, teacherRepository, studentRepository, userService) {
        this.lessonRepository = lessonRepository;
        this.attendanceRepository = attendanceRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.userService = userService;
    }
    async create(createLessonDto, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can create lessons');
        }
        let teacher;
        if (userRole === user_role_enum_1.UserRole.TEACHER) {
            const user = await this.userService.findOneById(userId);
            if (!user || user.role !== user_role_enum_1.UserRole.TEACHER) {
                throw new common_1.NotFoundException('Teacher not found');
            }
            if (user.userId !== createLessonDto.teacherId) {
                throw new common_1.ForbiddenException('Teachers can only create lessons for themselves');
            }
            teacher = await this.teacherRepository.findOne({ where: { id: user.userId } });
            if (!teacher) {
                throw new common_1.NotFoundException('Teacher entity not found');
            }
        }
        else if (userRole === user_role_enum_1.UserRole.ASSISTANT) {
            const user = await this.userService.findOneById(userId);
            if (!user || user.role !== user_role_enum_1.UserRole.ASSISTANT) {
                throw new common_1.NotFoundException('Assistant not found');
            }
            teacher = await this.teacherRepository.findOne({ where: { id: createLessonDto.teacherId } });
            if (!teacher) {
                throw new common_1.NotFoundException('Teacher not found');
            }
        }
        if (createLessonDto.startTime) {
            const startTime = new Date(createLessonDto.startTime);
            const attendanceStartTime = new Date(startTime.getTime() - 60 * 60 * 1000);
            createLessonDto['attendanceStartTime'] = attendanceStartTime;
        }
        const lesson = this.lessonRepository.create({ ...createLessonDto, teacherId: teacher.id });
        const savedLesson = await this.lessonRepository.save(lesson);
        const lessonWithTeacher = await this.lessonRepository.findOne({
            where: { id: savedLesson.id },
            relations: ['teacher'],
        });
        return {
            lesson: lessonWithTeacher,
        };
    }
    async findAll() {
        const lessons = await this.lessonRepository.find({
            relations: ['teacher', 'students'],
        });
        return { lessons };
    }
    async findOne(id) {
        const lesson = await this.lessonRepository.findOne({
            where: { id },
            relations: ['teacher', 'students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        return { lesson };
    }
    async findBySubject(subject) {
        const lessons = await this.lessonRepository.find({
            where: { subject },
            relations: ['teacher', 'students'],
        });
        return { lessons };
    }
    async update(id, updateLessonDto, userId, userRole) {
        const lesson = await this.findOne(id);
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can update lessons');
        }
        if (userRole === user_role_enum_1.UserRole.TEACHER) {
            const user = await this.userService.findOneById(userId);
            if (!user || user.role !== user_role_enum_1.UserRole.TEACHER || lesson.lesson.teacherId !== user.userId) {
                throw new common_1.ForbiddenException('Teachers can only update their own lessons');
            }
        }
        else if (userRole === user_role_enum_1.UserRole.ASSISTANT) {
        }
        Object.assign(lesson, updateLessonDto);
        return await this.lessonRepository.save(lesson.lesson);
    }
    async remove(id, userId, userRole) {
        const lesson = await this.findOne(id);
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can delete lessons');
        }
        if (userRole === user_role_enum_1.UserRole.TEACHER) {
            const user = await this.userService.findOneById(userId);
            if (!user || user.role !== user_role_enum_1.UserRole.TEACHER || lesson.lesson.teacherId !== user.userId) {
                throw new common_1.ForbiddenException('Teachers can only delete their own lessons');
            }
        }
        else if (userRole === user_role_enum_1.UserRole.ASSISTANT) {
        }
        await this.lessonRepository.remove(lesson.lesson);
    }
    async getLessonStudents(id) {
        const lesson = await this.lessonRepository.findOne({
            where: { id },
            relations: ['students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        return { students: lesson.students };
    }
    async getLessonsByTeacher(teacherId) {
        const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const lessons = await this.lessonRepository.find({
            where: { teacherId },
            relations: ['teacher', 'students'],
        });
        return { lessons };
    }
    async addStudentToLesson(lessonId, studentId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only assistants can add students to lessons');
        }
        const user = await this.userService.findOneById(userId);
        if (!user || user.role !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.NotFoundException('Assistant not found');
        }
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const isAlreadyAdded = lesson.students.some(student => student.id === studentId);
        if (isAlreadyAdded) {
            throw new common_1.ConflictException('Student is already added to this lesson');
        }
        await this.lessonRepository
            .createQueryBuilder()
            .relation(lesson_entity_1.Lesson, 'students')
            .of(lesson)
            .add(studentId);
        return await this.findOne(lessonId);
    }
    async removeStudentFromLesson(lessonId, studentId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only assistants can remove students from lessons');
        }
        const user = await this.userService.findOneById(userId);
        if (!user || user.role !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.NotFoundException('Assistant not found');
        }
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const isAdded = lesson.students.some(student => student.id === studentId);
        if (!isAdded) {
            throw new common_1.ConflictException('Student is not added to this lesson');
        }
        await this.lessonRepository
            .createQueryBuilder()
            .relation(lesson_entity_1.Lesson, 'students')
            .of(lesson)
            .remove(studentId);
        return await this.findOne(lessonId);
    }
    async subscribeToLesson(subscribeDto) {
        throw new common_1.ForbiddenException('Students cannot subscribe themselves. Only assistants can add students to lessons.');
    }
    async unsubscribeFromLesson(unsubscribeDto) {
        const { studentId, lessonId } = unsubscribeDto;
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const isSubscribed = lesson.students.some(student => student.id === studentId);
        if (!isSubscribed) {
            throw new common_1.ConflictException('Student is not subscribed to this lesson');
        }
        await this.lessonRepository
            .createQueryBuilder()
            .relation(lesson_entity_1.Lesson, 'students')
            .of(lesson)
            .remove(studentId);
        return await this.findOne(lessonId);
    }
    async getStudentSubscriptions(studentId) {
        const lessons = await this.lessonRepository
            .createQueryBuilder('lesson')
            .leftJoinAndSelect('lesson.students', 'student')
            .where('student.id = :studentId', { studentId })
            .getMany();
        return { subscriptions: lessons };
    }
    async checkStudentSubscription(studentId, lessonId) {
        const lesson = await this.lessonRepository
            .createQueryBuilder('lesson')
            .leftJoinAndSelect('lesson.students', 'student')
            .where('lesson.id = :lessonId', { lessonId })
            .andWhere('student.id = :studentId', { studentId })
            .getOne();
        return !!lesson;
    }
    async getLessonsByDate(date) {
        const lessons = await this.lessonRepository.find({
            where: { scheduledDate: new Date(date) },
            relations: ['teacher', 'students'],
        });
        return { lessons };
    }
    async startAttendance(startAttendanceDto, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can start attendance');
        }
        const lesson = await this.findOne(startAttendanceDto.lessonId);
        const now = new Date();
        const attendanceStartTime = lesson.lesson.attendanceStartTime;
        if (!attendanceStartTime) {
            throw new common_1.BadRequestException('Lesson does not have a scheduled start time');
        }
        if (now < attendanceStartTime) {
            throw new common_1.BadRequestException('Attendance can only be started 1 hour before the lesson');
        }
        if (lesson.lesson.status !== lesson_entity_1.LessonStatus.SCHEDULED && lesson.lesson.status !== lesson_entity_1.LessonStatus.COMPLETED) {
            throw new common_1.BadRequestException('Attendance can only be started for scheduled or completed recurring lessons');
        }
        if (lesson.lesson.status === lesson_entity_1.LessonStatus.COMPLETED) {
            if (lesson.lesson.recurrenceType === lesson_entity_1.LessonRecurrenceType.NONE) {
                throw new common_1.BadRequestException('Non-recurring completed lessons cannot be reopened');
            }
            await this.reopenLesson(startAttendanceDto.lessonId, userId, userRole);
        }
        lesson.lesson.status = lesson_entity_1.LessonStatus.ATTENDANCE_OPEN;
        await this.lessonRepository.save(lesson.lesson);
        const students = await this.getLessonStudents(startAttendanceDto.lessonId);
        for (const student of students.students) {
            const existingAttendance = await this.attendanceRepository.findOne({
                where: { lessonId: startAttendanceDto.lessonId, studentId: student.id }
            });
            if (!existingAttendance) {
                const attendance = this.attendanceRepository.create({
                    lessonId: startAttendanceDto.lessonId,
                    studentId: student.id,
                    status: lesson_attendance_entity_1.AttendanceStatus.ABSENT,
                    markedBy: userId
                });
                await this.attendanceRepository.save(attendance);
            }
        }
        return { lesson: lesson.lesson };
    }
    async markAttendance(markAttendanceDto, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can mark attendance');
        }
        const lesson = await this.findOne(markAttendanceDto.lessonId);
        if (lesson.lesson.status !== lesson_entity_1.LessonStatus.ATTENDANCE_OPEN && lesson.lesson.status !== lesson_entity_1.LessonStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Attendance can only be marked when lesson is open for attendance or in progress');
        }
        const students = await this.getLessonStudents(markAttendanceDto.lessonId);
        const isEnrolled = students.students.some(student => student.id === markAttendanceDto.studentId);
        if (!isEnrolled) {
            throw new common_1.BadRequestException('Student is not enrolled in this lesson');
        }
        let attendance = await this.attendanceRepository.findOne({
            where: { lessonId: markAttendanceDto.lessonId, studentId: markAttendanceDto.studentId }
        });
        if (!attendance) {
            attendance = this.attendanceRepository.create({
                lessonId: markAttendanceDto.lessonId,
                studentId: markAttendanceDto.studentId,
                status: markAttendanceDto.status,
                attendanceTime: new Date(),
                notes: markAttendanceDto.notes,
                markedBy: userId
            });
        }
        else {
            attendance.status = markAttendanceDto.status;
            attendance.attendanceTime = new Date();
            attendance.notes = markAttendanceDto.notes;
            attendance.markedBy = userId;
        }
        return await this.attendanceRepository.save(attendance);
    }
    async getLessonAttendance(lessonId) {
        const lesson = await this.findOne(lessonId);
        const attendance = await this.attendanceRepository.find({
            where: { lessonId },
            relations: ['student'],
            order: { createdAt: 'ASC' }
        });
        return { attendance };
    }
    async getStudentAttendanceHistory(studentId) {
        const attendanceHistory = await this.attendanceRepository.find({
            where: { studentId },
            relations: ['lesson'],
            order: { createdAt: 'DESC' }
        });
        return { attendanceHistory };
    }
    async startLesson(lessonId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can start lessons');
        }
        const lesson = await this.findOne(lessonId);
        if (lesson.lesson.status !== lesson_entity_1.LessonStatus.ATTENDANCE_OPEN && lesson.lesson.status !== lesson_entity_1.LessonStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Lesson cannot be started in its current status');
        }
        lesson.lesson.status = lesson_entity_1.LessonStatus.IN_PROGRESS;
        return { lesson: await this.lessonRepository.save(lesson.lesson) };
    }
    async completeLesson(lessonId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can complete lessons');
        }
        const lesson = await this.findOne(lessonId);
        if (lesson.lesson.status !== lesson_entity_1.LessonStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Only lessons in progress can be completed');
        }
        lesson.lesson.status = lesson_entity_1.LessonStatus.COMPLETED;
        const completedLesson = await this.lessonRepository.save(lesson.lesson);
        if (lesson.lesson.recurrenceType !== lesson_entity_1.LessonRecurrenceType.NONE) {
            await this.scheduleNextOccurrence(lesson.lesson);
        }
        return { lesson: completedLesson };
    }
    async scheduleNextOccurrence(lesson) {
        const nextDate = this.calculateNextOccurrence(lesson);
        if (nextDate) {
            const nextLesson = this.lessonRepository.create({
                title: lesson.title,
                description: lesson.description,
                subject: lesson.subject,
                scheduledDate: nextDate,
                startTime: lesson.startTime,
                endTime: lesson.endTime,
                attendanceStartTime: lesson.attendanceStartTime,
                room: lesson.room,
                teacherId: lesson.teacherId,
                recurrenceType: lesson.recurrenceType,
                recurrencePattern: lesson.recurrencePattern,
                status: lesson_entity_1.LessonStatus.SCHEDULED,
                students: lesson.students
            });
            await this.lessonRepository.save(nextLesson);
        }
    }
    calculateNextOccurrence(lesson) {
        if (!lesson.scheduledDate || lesson.recurrenceType === lesson_entity_1.LessonRecurrenceType.NONE) {
            return null;
        }
        const currentDate = new Date(lesson.scheduledDate);
        const nextDate = new Date(currentDate);
        switch (lesson.recurrenceType) {
            case lesson_entity_1.LessonRecurrenceType.DAILY:
                nextDate.setDate(currentDate.getDate() + 1);
                break;
            case lesson_entity_1.LessonRecurrenceType.WEEKLY:
                if (lesson.recurrencePattern?.dayOfWeek !== undefined) {
                    const targetDay = lesson.recurrencePattern.dayOfWeek;
                    const currentDay = currentDate.getDay();
                    const daysToAdd = (targetDay - currentDay + 7) % 7 || 7;
                    nextDate.setDate(currentDate.getDate() + daysToAdd);
                }
                else {
                    nextDate.setDate(currentDate.getDate() + 7);
                }
                break;
            case lesson_entity_1.LessonRecurrenceType.MONTHLY:
                nextDate.setMonth(currentDate.getMonth() + 1);
                break;
            default:
                return null;
        }
        return nextDate;
    }
    async reopenLesson(lessonId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can reopen lessons');
        }
        const lesson = await this.findOne(lessonId);
        if (lesson.lesson.status !== lesson_entity_1.LessonStatus.COMPLETED) {
            throw new common_1.BadRequestException('Only completed lessons can be reopened');
        }
        if (lesson.lesson.recurrenceType === lesson_entity_1.LessonRecurrenceType.NONE) {
            throw new common_1.BadRequestException('Non-recurring lessons cannot be reopened');
        }
        lesson.lesson.status = lesson_entity_1.LessonStatus.SCHEDULED;
        const nextDate = this.calculateNextOccurrence(lesson.lesson);
        if (nextDate) {
            lesson.lesson.scheduledDate = nextDate;
            if (lesson.lesson.startTime) {
                const startTime = new Date(lesson.lesson.startTime);
                const attendanceStartTime = new Date(startTime.getTime() - 60 * 60 * 1000);
                lesson.lesson.attendanceStartTime = attendanceStartTime;
            }
        }
        return { lesson: await this.lessonRepository.save(lesson.lesson) };
    }
    async getUpcomingLessons() {
        const now = new Date();
        const lessons = await this.lessonRepository.find({
            where: {
                scheduledDate: (0, typeorm_3.MoreThan)(now),
                status: lesson_entity_1.LessonStatus.SCHEDULED
            },
            relations: ['teacher', 'students'],
            order: { scheduledDate: 'ASC' }
        });
        return { lessons };
    }
    async getCompletedLessons() {
        const lessons = await this.lessonRepository.find({
            where: { status: lesson_entity_1.LessonStatus.COMPLETED },
            relations: ['teacher', 'students'],
            order: { scheduledDate: 'DESC' }
        });
        return { lessons };
    }
};
exports.LessonService = LessonService;
exports.LessonService = LessonService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(1, (0, typeorm_1.InjectRepository)(lesson_attendance_entity_1.LessonAttendance)),
    __param(2, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        user_service_1.UserService])
], LessonService);
//# sourceMappingURL=lesson.service.js.map