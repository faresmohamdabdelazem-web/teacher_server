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
        const lesson = this.lessonRepository.create({ ...createLessonDto, teacherId: teacher.id, price: createLessonDto.price });
        const savedLesson = await this.lessonRepository.save(lesson);
        const lessonWithTeacher = await this.lessonRepository.findOne({
            where: { id: savedLesson.id },
            relations: ['teacher'],
        });
        return {
            lesson: lessonWithTeacher,
        };
    }
    async checkAndUpdateExpiredLessons(lessons) {
        const now = new Date();
        const lessonsToUpdate = [];
        for (const lesson of lessons) {
            if (lesson.scheduledDate && lesson.status !== lesson_entity_1.LessonStatus.COMPLETED && lesson.status !== lesson_entity_1.LessonStatus.CANCELLED && lesson.status !== lesson_entity_1.LessonStatus.EXPIRED) {
                const lessonDate = new Date(lesson.scheduledDate);
                const lessonEndTime = new Date(lessonDate.getTime() + (2 * 60 * 60 * 1000));
                if (now > lessonEndTime) {
                    lesson.status = lesson_entity_1.LessonStatus.EXPIRED;
                    lessonsToUpdate.push(lesson);
                }
            }
        }
        if (lessonsToUpdate.length > 0) {
            await this.lessonRepository.save(lessonsToUpdate);
        }
    }
    async findAll() {
        const lessons = await this.lessonRepository.find({
            relations: ['teacher', 'students'],
        });
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return {
                ...lesson,
                attendanceHistory: attendance
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async findOne(id) {
        const lesson = await this.lessonRepository.findOne({
            where: { id },
            relations: ['teacher', 'students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
        const attendance = await this.attendanceRepository.find({
            where: {
                lessonId: lesson.id,
                createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
            },
            relations: ['student'],
            order: { createdAt: 'ASC' }
        });
        return {
            lesson: {
                ...lesson,
                attendanceHistory: attendance
            }
        };
    }
    async findBySubject(subject) {
        const lessons = await this.lessonRepository.find({
            where: { subject },
            relations: ['teacher', 'students'],
        });
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return {
                ...lesson,
                attendanceHistory: attendance
            };
        }));
        return { lessons: lessonsWithAttendance };
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
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return {
                ...lesson,
                attendanceHistory: attendance
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async addStudentToLesson(lessonId, studentId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.ASSISTANT && userRole !== user_role_enum_1.UserRole.TEACHER) {
            throw new common_1.ForbiddenException('Only assistants and teachers can add students to lessons');
        }
        const user = await this.userService.findOneById(userId);
        if (!user || (user.role !== user_role_enum_1.UserRole.ASSISTANT && user.role !== user_role_enum_1.UserRole.TEACHER)) {
            throw new common_1.NotFoundException('Assistant or teacher not found');
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
        if (lesson.grade && student.grade && lesson.grade !== student.grade) {
            throw new common_1.BadRequestException(`Student grade (${student.grade}) does not match lesson grade (${lesson.grade})`);
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
        return {
            lessonId: lessonId,
            studentId: studentId,
        };
    }
    async removeStudentFromLesson(lessonId, studentId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.ASSISTANT && userRole !== user_role_enum_1.UserRole.TEACHER) {
            throw new common_1.ForbiddenException('Only assistants and teachers can remove students from lessons');
        }
        const user = await this.userService.findOneById(userId);
        if (!user || (user.role !== user_role_enum_1.UserRole.ASSISTANT && user.role !== user_role_enum_1.UserRole.TEACHER)) {
            throw new common_1.NotFoundException('Assistant or teacher not found');
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
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return {
                ...lesson,
                attendanceHistory: attendance
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async startAttendance(startAttendanceDto, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER && userRole !== user_role_enum_1.UserRole.ASSISTANT) {
            throw new common_1.ForbiddenException('Only teachers and assistants can start attendance');
        }
        const lesson = await this.findOne(startAttendanceDto.lessonId);
        const now = new Date();
        const attendanceStartTime = lesson.lesson.attendanceStartTime;
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const scheduledDate = new Date(lesson.lesson.scheduledDate);
        const lessonDate = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
        console.log('Today (date only):', today);
        console.log('Lesson date (date only):', lessonDate);
        if (today < lessonDate) {
            throw new common_1.BadRequestException('Attendance cannot be started before the scheduled date');
        }
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (lessonDate < yesterday) {
            throw new common_1.BadRequestException('Attendance cannot be started for lessons that are more than 1 day in the past');
        }
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
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const scheduledDate = new Date(lesson.lesson.scheduledDate);
        const lessonDate = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const students = await this.getLessonStudents(markAttendanceDto.lessonId);
        const isEnrolled = students.students.some(student => student.id === markAttendanceDto.studentId);
        if (!isEnrolled) {
            throw new common_1.BadRequestException('Student is not enrolled in this lesson');
        }
        if (lessonDate < yesterday) {
            throw new common_1.BadRequestException('Attendance cannot be marked for lessons that are more than 1 day in the past');
        }
        if (lesson.lesson.status !== lesson_entity_1.LessonStatus.ATTENDANCE_OPEN && lesson.lesson.status !== lesson_entity_1.LessonStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Attendance can only be marked when lesson is open for attendance or in progress');
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
        const savedAttendance = await this.attendanceRepository.save(attendance);
        const attendanceWithStudent = await this.attendanceRepository.findOne({
            where: { id: savedAttendance.id },
            relations: ['student']
        });
        return { attendance: attendanceWithStudent };
    }
    async getLessonAttendance(lessonId, date) {
        const lesson = await this.findOne(lessonId);
        if (date) {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId,
                    createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return { attendance };
        }
        else {
            const attendance = await this.attendanceRepository.find({
                where: { lessonId },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return { attendance };
        }
    }
    async getLessonAttendanceHistory(lessonId, startDate, endDate) {
        const lesson = await this.findOne(lessonId);
        const startOfRange = new Date(startDate);
        const endOfRange = new Date(endDate);
        endOfRange.setHours(23, 59, 59, 999);
        const attendance = await this.attendanceRepository.find({
            where: {
                lessonId,
                createdAt: (0, typeorm_3.Between)(startOfRange, endOfRange)
            },
            relations: ['student'],
            order: { createdAt: 'ASC' }
        });
        return { attendance };
    }
    async getLessonAttendanceForDate(lessonId, date) {
        const lesson = await this.findOne(lessonId);
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        const attendance = await this.attendanceRepository.find({
            where: {
                lessonId,
                createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
            },
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
            const nextDate = this.calculateNextOccurrence(lesson.lesson);
            if (nextDate) {
                completedLesson.status = lesson_entity_1.LessonStatus.SCHEDULED;
                completedLesson.scheduledDate = nextDate;
                if (completedLesson.startTime) {
                    const startTime = new Date(completedLesson.startTime);
                    const attendanceStartTime = new Date(startTime.getTime() - 60 * 60 * 1000);
                    completedLesson.attendanceStartTime = attendanceStartTime;
                }
                await this.lessonRepository.save(completedLesson);
            }
        }
        return { lesson: completedLesson };
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
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return {
                ...lesson,
                attendanceHistory: attendance
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async getCompletedLessons() {
        const lessons = await this.lessonRepository.find({
            where: { status: lesson_entity_1.LessonStatus.COMPLETED },
            relations: ['teacher', 'students'],
            order: { scheduledDate: 'DESC' }
        });
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return {
                ...lesson,
                attendanceHistory: attendance
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async getTeacherTodayLessons(teacherId, subject, status) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        const whereClause = {
            teacherId: teacherId,
            scheduledDate: (0, typeorm_3.Between)(startOfDay, endOfDay),
        };
        if (subject) {
            whereClause.subject = subject;
        }
        if (status) {
            whereClause.status = status;
        }
        const lessons = await this.lessonRepository.find({
            where: whereClause,
            relations: ['teacher', 'students'],
            order: { startTime: 'ASC' },
        });
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_3.Between)(startOfDay, endOfDay)
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return {
                ...lesson,
                attendanceHistory: attendance
            };
        }));
        return { lessons: lessonsWithAttendance };
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