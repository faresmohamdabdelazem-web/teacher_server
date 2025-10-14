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
const assistant_entity_1 = require("../user/assistant/assistant.entity");
const teacher_entity_1 = require("../user/teacher/teacher.entity");
const student_entity_1 = require("../user/student/student.entity");
const user_service_1 = require("../user/user.service");
const user_role_enum_1 = require("../user/user.role.enum");
const typeorm_3 = require("typeorm");
const teacher_stats_service_1 = require("./teacher-stats.service");
const whatsapp_service_1 = require("../notification/whatsapp.service");
const student_service_1 = require("../user/student/student.service");
const section_entity_1 = require("../section/entities/section.entity");
let LessonService = class LessonService {
    constructor(assistantRepository, lessonRepository, attendanceRepository, teacherRepository, studentRepository, sectionRepository, userService, teacherStatsService, whatsAppService, studentservice) {
        this.assistantRepository = assistantRepository;
        this.lessonRepository = lessonRepository;
        this.attendanceRepository = attendanceRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.sectionRepository = sectionRepository;
        this.userService = userService;
        this.teacherStatsService = teacherStatsService;
        this.whatsAppService = whatsAppService;
        this.studentservice = studentservice;
    }
    async create(createLessonDto, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER &&
            userRole !== user_role_enum_1.UserRole.ASSISTANT &&
            userRole !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only teachers, assistants, or admins can create lessons');
        }
        const user = await this.userService.findOneById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!createLessonDto['sectionId']) {
            throw new common_1.BadRequestException('Section ID is required to create a lesson');
        }
        const section = await this.sectionRepository.findOne({
            where: { id: createLessonDto['sectionId'] },
            relations: ['branches'],
        });
        if (!section) {
            throw new common_1.NotFoundException('Section not found');
        }
        if (userRole === user_role_enum_1.UserRole.ASSISTANT) {
            const assistant = await this.assistantRepository.findOne({
                where: { userId: user.userId },
                relations: ['branch'],
            });
            if (!assistant || !assistant.branch) {
                throw new common_1.ForbiddenException('Assistant has no assigned branch');
            }
            const sectionBranchIds = section.branches.map((b) => b.id);
            const isInSameBranch = sectionBranchIds.includes(assistant.branch.id);
            if (!isInSameBranch) {
                throw new common_1.ForbiddenException('Assistant can only create lessons in sections belonging to their own branch');
            }
        }
        if (createLessonDto.startTime) {
            const startTime = new Date(createLessonDto.startTime);
            createLessonDto['attendanceStartTime'] = new Date(startTime.getTime() - 60 * 60 * 1000);
        }
        if (createLessonDto.scheduledDate) {
            const scheduledDate = new Date(createLessonDto.scheduledDate);
            createLessonDto.scheduledDate = scheduledDate.toISOString();
        }
        const lesson = this.lessonRepository.create({
            ...createLessonDto,
            status: lesson_entity_1.LessonStatus.SCHEDULED,
        });
        const savedLesson = await this.lessonRepository.save(lesson);
        console.log('✅ Lesson created:', savedLesson);
        if (savedLesson && savedLesson.sectionId) {
            const studentsInSection = await this.studentRepository.find({
                where: { sectionId: savedLesson.sectionId },
            });
            if (studentsInSection.length > 0) {
                const attendanceRecords = studentsInSection.map((student) => this.attendanceRepository.create({
                    lessonId: savedLesson.id,
                    studentId: student.id,
                    status: lesson_attendance_entity_1.AttendanceStatus.ABSENT,
                    markedBy: 'system',
                    attendanceTime: savedLesson.scheduledDate,
                }));
                await this.attendanceRepository.save(attendanceRecords);
                console.log('✅ Attendance records created:', attendanceRecords.length);
            }
        }
        return { lesson: savedLesson };
    }
    async checkAndUpdateExpiredLessons(lessons) {
        const now = new Date();
        const lessonsToUpdate = [];
        for (const lesson of lessons) {
            if (lesson.status !== lesson_entity_1.LessonStatus.COMPLETED &&
                lesson.status !== lesson_entity_1.LessonStatus.CANCELLED &&
                lesson.status !== lesson_entity_1.LessonStatus.EXPIRED) {
                let lessonEndTime;
                if (lesson.endTime) {
                    lessonEndTime = new Date(lesson.endTime);
                }
                else if (lesson.startTime) {
                    lessonEndTime = new Date(lesson.startTime.getTime() + 60 * 60 * 1000);
                }
                else if (lesson.scheduledDate) {
                    const lessonDate = new Date(lesson.scheduledDate);
                    lessonEndTime = new Date(lessonDate.getTime() + 2 * 60 * 60 * 1000);
                }
                else {
                    continue;
                }
                const expirationTime = new Date(lessonEndTime.getTime() + 2 * 60 * 60 * 1000);
                if (now > expirationTime &&
                    lesson.recurrenceType === lesson_entity_1.LessonRecurrenceType.NONE) {
                    lesson.status = lesson_entity_1.LessonStatus.EXPIRED;
                    lessonsToUpdate.push(lesson);
                }
            }
        }
        if (lessonsToUpdate.length > 0) {
            await this.lessonRepository.save(lessonsToUpdate);
        }
    }
    async findAll(user, scheduledDate, sectionId, branchId) {
        const where = {};
        if (scheduledDate) {
            const date = new Date(scheduledDate);
            const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
            where.scheduledDate = (0, typeorm_2.Between)(startOfDay, endOfDay);
        }
        if (sectionId) {
            where.section = { id: sectionId };
        }
        const lessons = await this.lessonRepository.find({
            where,
            relations: ['teacher', 'students', 'section', 'section.branches'],
        });
        let filteredLessons = lessons;
        if (user.role === user_role_enum_1.UserRole.ASSISTANT) {
            const assistant = await this.assistantRepository.findOne({
                where: { userId: user.id },
                relations: ['branch'],
            });
            if (!assistant || !assistant.branch) {
                return { lessons: [] };
            }
            filteredLessons = lessons.filter((lesson) => lesson.section?.branches?.some((b) => b.id === assistant.branch.id));
        }
        else if (user.role === user_role_enum_1.UserRole.ADMIN && branchId) {
            filteredLessons = lessons.filter((lesson) => lesson.section?.branches?.some((b) => b.id === branchId));
        }
        await this.checkAndUpdateExpiredLessons(filteredLessons);
        const lessonsWithAttendance = await Promise.all(filteredLessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
                },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                subject: lesson.subject,
                scheduledDate: lesson.scheduledDate,
                startTime: lesson.startTime,
                endTime: lesson.endTime,
                room: lesson.room,
                recurrenceType: lesson.recurrenceType,
                status: lesson.status,
                teacherId: lesson.teacherId,
                sectionId: lesson.sectionId,
                sectionName: lesson.section?.name ?? null,
                sectionNameAr: lesson.section?.nameAr ?? null,
                branchNames: lesson.section?.branches?.map((b) => b.name) ?? [],
                branchNamesAr: lesson.section?.branches?.map((b) => b.nameAr) ?? [],
                branchId: lesson.section?.branches?.[0]?.id ?? null,
                price: lesson.price,
                pricingType: lesson.pricingType,
                grade: lesson.grade,
                students: lesson.students,
                attendanceHistory: attendance,
                createdAt: lesson.createdAt,
                updatedAt: lesson.updatedAt,
                teachername: lesson.teachername ?? 'Teacher',
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async findOne(id) {
        const lesson = await this.lessonRepository.findOne({
            where: { id },
            relations: ['teacher', 'students', 'section', 'branch'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        await this.checkAndUpdateExpiredLessons([lesson]);
        const lessonDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
        const attendance = await this.attendanceRepository.find({
            where: {
                lessonId: lesson.id,
                createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
            },
            relations: ['student'],
            order: { createdAt: 'ASC' },
        });
        return {
            lesson: {
                ...lesson,
                attendanceHistory: attendance,
            },
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
                    createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
                },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                ...lesson,
                attendanceHistory: attendance,
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
            if (!user ||
                user.role !== user_role_enum_1.UserRole.TEACHER ||
                lesson.lesson.teacherId !== user.userId) {
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
        if (userRole !== user_role_enum_1.UserRole.TEACHER &&
            userRole !== user_role_enum_1.UserRole.ASSISTANT &&
            userRole !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only teachers and assistants can delete lessons');
        }
        if (userRole === user_role_enum_1.UserRole.TEACHER) {
            const user = await this.userService.findOneById(userId);
            if (!user ||
                user.role !== user_role_enum_1.UserRole.TEACHER ||
                lesson.lesson.teacherId !== user.userId) {
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
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
        });
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
                    createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
                },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                ...lesson,
                attendanceHistory: attendance,
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async addStudentToLesson(lessonId, studentId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.ASSISTANT && userRole !== user_role_enum_1.UserRole.TEACHER) {
            throw new common_1.ForbiddenException('Only assistants and teachers can add students to lessons');
        }
        const user = await this.userService.findOneById(userId);
        if (!user ||
            (user.role !== user_role_enum_1.UserRole.ASSISTANT && user.role !== user_role_enum_1.UserRole.TEACHER)) {
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
            throw new common_1.NotFoundException('هذا الطالب غير موجود');
        }
        if (lesson.grade && student.grade && lesson.grade !== student.grade) {
            throw new common_1.BadRequestException(`Student grade (${student.grade}) does not match lesson grade (${lesson.grade})`);
        }
        const isAlreadyAdded = lesson.students.some((student) => student.id === studentId);
        if (isAlreadyAdded) {
            throw new common_1.ConflictException('Student is already added to this lesson');
        }
        await this.lessonRepository
            .createQueryBuilder()
            .relation(lesson_entity_1.Lesson, 'students')
            .of(lesson)
            .add(studentId);
        await this.teacherStatsService.onStudentAddedToLesson(lessonId);
        return {
            lessonId: lessonId,
            studentId: studentId,
            studentPhoneNumber: student.phoneNumber || null,
            firstName: student.firstName,
            lastName: student.lastName,
        };
    }
    async transferStudentToLesson(studentId, toLessonId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.ASSISTANT && userRole !== user_role_enum_1.UserRole.TEACHER) {
            throw new common_1.ForbiddenException('Only assistants and teachers can transfer students between lessons');
        }
        const user = await this.userService.findOneById(userId);
        if (!user ||
            (user.role !== user_role_enum_1.UserRole.ASSISTANT && user.role !== user_role_enum_1.UserRole.TEACHER)) {
            throw new common_1.NotFoundException('Assistant or teacher not found');
        }
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('');
        }
        const toLesson = await this.lessonRepository.findOne({
            where: { id: toLessonId },
            relations: ['students'],
        });
        if (!toLesson) {
            throw new common_1.NotFoundException('Destination lesson not found');
        }
        const isInDestinationLesson = toLesson.students.some((s) => s.id === studentId);
        if (isInDestinationLesson) {
            throw new common_1.BadRequestException('Student is already enrolled in the destination lesson');
        }
        if (toLesson.grade && student.grade && toLesson.grade !== student.grade) {
            throw new common_1.BadRequestException(`Student grade (${student.grade}) does not match destination lesson grade (${toLesson.grade})`);
        }
        const currentLesson = await this.lessonRepository
            .createQueryBuilder('lesson')
            .leftJoinAndSelect('lesson.students', 'student')
            .where('student.id = :studentId', { studentId })
            .getOne();
        if (!currentLesson) {
            throw new common_1.BadRequestException('Student is not enrolled in any lesson');
        }
        if (currentLesson.id === toLessonId) {
            throw new common_1.BadRequestException('Student is already enrolled in the destination lesson');
        }
        await this.lessonRepository
            .createQueryBuilder()
            .relation(lesson_entity_1.Lesson, 'students')
            .of(currentLesson)
            .remove(studentId);
        await this.lessonRepository
            .createQueryBuilder()
            .relation(lesson_entity_1.Lesson, 'students')
            .of(toLesson)
            .add(studentId);
        await this.teacherStatsService.onStudentRemovedFromLesson(currentLesson.id);
        await this.teacherStatsService.onStudentAddedToLesson(toLessonId);
        return { message: 'Student transferred successfully' };
    }
    async removeStudentFromLesson(lessonId, studentId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.ASSISTANT && userRole !== user_role_enum_1.UserRole.TEACHER) {
            throw new common_1.ForbiddenException('Only assistants and teachers can remove students from lessons');
        }
        const user = await this.userService.findOneById(userId);
        if (!user ||
            (user.role !== user_role_enum_1.UserRole.ASSISTANT && user.role !== user_role_enum_1.UserRole.TEACHER)) {
            throw new common_1.NotFoundException('Assistant or teacher not found');
        }
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const isAdded = lesson.students.some((student) => student.id === studentId);
        if (!isAdded) {
            throw new common_1.ConflictException('Student is not added to this lesson');
        }
        await this.lessonRepository
            .createQueryBuilder()
            .relation(lesson_entity_1.Lesson, 'students')
            .of(lesson)
            .remove(studentId);
        await this.teacherStatsService.onStudentRemovedFromLesson(lessonId);
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
        const isSubscribed = lesson.students.some((student) => student.id === studentId);
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
                    createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
                },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                ...lesson,
                attendanceHistory: attendance,
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async getTodayLessons(date, subject, status, grade) {
        let startOfDay;
        let endOfDay;
        if (date) {
            const targetDate = new Date(date);
            startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        }
        else {
            const today = new Date();
            startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        }
        const whereClause = {
            scheduledDate: (0, typeorm_2.Between)(startOfDay, endOfDay),
        };
        if (subject) {
            whereClause.subject = subject;
        }
        if (status) {
            whereClause.status = status;
        }
        if (grade) {
            whereClause.grade = grade;
        }
        const lessons = await this.lessonRepository.find({
            where: whereClause,
            relations: ['teacher', 'students'],
            order: { startTime: 'ASC' },
        });
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const lessonStartOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const lessonEndOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_2.Between)(lessonStartOfDay, lessonEndOfDay),
                },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                ...lesson,
                attendanceHistory: attendance,
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async startAttendance(startAttendanceDto, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER &&
            userRole !== user_role_enum_1.UserRole.ASSISTANT &&
            userRole !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only teachers,admin and assistants can start attendance');
        }
        const lesson = await this.findOne(startAttendanceDto.lessonId);
        const now = new Date();
        const attendanceStartTime = lesson.lesson.attendanceStartTime;
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const scheduledDate = new Date(lesson.lesson.scheduledDate);
        const lessonDate = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());
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
        if (lesson.lesson.status !== lesson_entity_1.LessonStatus.SCHEDULED &&
            lesson.lesson.status !== lesson_entity_1.LessonStatus.COMPLETED) {
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
        return { lesson: lesson.lesson };
    }
    async markAttendance(markAttendanceDto, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER &&
            userRole !== user_role_enum_1.UserRole.ASSISTANT &&
            userRole !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only teachers, assistants, and admins can mark attendance');
        }
        const lesson = await this.lessonRepository.findOne({
            where: { id: markAttendanceDto.lessonId },
            relations: ['section', 'section.branches'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException(`Lesson with ID ${markAttendanceDto.lessonId} not found`);
        }
        if (lesson.status !== lesson_entity_1.LessonStatus.ATTENDANCE_OPEN &&
            lesson.status !== lesson_entity_1.LessonStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Attendance can only be marked when lesson is open for attendance or in progress');
        }
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lessonDate = new Date(lesson.scheduledDate);
        const normalizedLessonDate = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (normalizedLessonDate < yesterday) {
            throw new common_1.BadRequestException('Attendance cannot be marked for lessons more than 1 day old');
        }
        const student = await this.studentRepository.findOne({
            where: { id: markAttendanceDto.studentId },
            relations: ['branch'],
        });
        if (!student) {
            throw new common_1.NotFoundException(`Student with ID ${markAttendanceDto.studentId} not found`);
        }
        if (student.branch.id !== lesson.section?.branches?.[0]?.id) {
            throw new common_1.BadRequestException('Student and lesson do not belong to the same branch');
        }
        let attendanceRecord = await this.attendanceRepository.findOne({
            where: {
                lessonId: markAttendanceDto.lessonId,
                studentId: markAttendanceDto.studentId,
            },
        });
        let savedAttendance;
        if (attendanceRecord) {
            if (attendanceRecord.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT &&
                markAttendanceDto.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT) {
                throw new common_1.ConflictException('This student is already marked as present.');
            }
            attendanceRecord.status = markAttendanceDto.status;
            attendanceRecord.attendanceTime = new Date();
            attendanceRecord.notes = markAttendanceDto.notes;
            attendanceRecord.markedBy = userId;
            savedAttendance = await this.attendanceRepository.save(attendanceRecord);
        }
        else {
            const newAttendance = this.attendanceRepository.create({
                lessonId: markAttendanceDto.lessonId,
                studentId: markAttendanceDto.studentId,
                status: markAttendanceDto.status,
                attendanceTime: new Date(),
                notes: markAttendanceDto.notes,
                markedBy: userId,
            });
            savedAttendance = await this.attendanceRepository.save(newAttendance);
        }
        if (markAttendanceDto.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT &&
            student.parentPhoneNumber) {
            const studentName = `${student.firstName} ${student.lastName}`;
            await this.whatsAppService.sendPresentNotification(student.parentPhoneNumber, studentName, lesson.title, lesson.scheduledDate, lesson.subject);
        }
        if (markAttendanceDto.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT) {
            await this.studentservice.logPresence(markAttendanceDto.studentId, lesson.title);
        }
        return { attendance: savedAttendance };
    }
    async getLessonAttendance(lessonId, date) {
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['section', 'section.branches'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const sectionId = lesson.section?.id;
        const branchId = lesson.section?.branches?.[0]?.id;
        if (!sectionId || !branchId) {
            throw new common_1.NotFoundException('Lesson section or branch not found');
        }
        let whereCondition = {
            lessonId,
            student: {
                sectionId,
                branchId,
            },
        };
        if (date) {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
            whereCondition.createdAt = (0, typeorm_2.Between)(startOfDay, endOfDay);
        }
        const attendance = await this.attendanceRepository.find({
            where: whereCondition,
            relations: ['student', 'lesson', 'student.section', 'student.branch'],
            order: {
                status: 'ASC',
                student: { firstName: 'ASC' },
            },
        });
        attendance.sort((a, b) => {
            if (a.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT &&
                b.status !== lesson_attendance_entity_1.AttendanceStatus.PRESENT)
                return -1;
            if (a.status !== lesson_attendance_entity_1.AttendanceStatus.PRESENT &&
                b.status === lesson_attendance_entity_1.AttendanceStatus.PRESENT)
                return 1;
            return 0;
        });
        return { attendance };
    }
    async getStudentAttendanceHistory(studentId) {
        const attendanceHistory = await this.attendanceRepository.find({
            where: { studentId },
            relations: ['lesson'],
            order: { createdAt: 'DESC' },
        });
        return { attendanceHistory };
    }
    async startLesson(lessonId, userId, userRole) {
        if (userRole !== user_role_enum_1.UserRole.TEACHER &&
            userRole !== user_role_enum_1.UserRole.ASSISTANT &&
            userRole !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only teachers and assistants can start lessons');
        }
        const lesson = await this.findOne(lessonId);
        if (lesson.lesson.status !== lesson_entity_1.LessonStatus.ATTENDANCE_OPEN &&
            lesson.lesson.status !== lesson_entity_1.LessonStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Lesson cannot be started in its current status');
        }
        lesson.lesson.status = lesson_entity_1.LessonStatus.IN_PROGRESS;
        return { lesson: await this.lessonRepository.save(lesson.lesson) };
    }
    async completeLesson(lessonId) {
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['teacher', 'students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        if (lesson.status !== lesson_entity_1.LessonStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('Lesson must be in progress to complete');
        }
        const currentLessonDate = new Date(lesson.scheduledDate);
        const oldStatus = lesson.status;
        lesson.status = lesson_entity_1.LessonStatus.COMPLETED;
        const completedLesson = await this.lessonRepository.save(lesson);
        await this.markAbsentStudentsWithoutAttendance(lessonId);
        await this.sendAbsenceNotifications(lessonId, currentLessonDate);
        if (lesson.recurrenceType !== lesson_entity_1.LessonRecurrenceType.NONE) {
            const nextDate = this.calculateNextOccurrence(lesson);
            if (nextDate) {
                completedLesson.status = lesson_entity_1.LessonStatus.SCHEDULED;
                completedLesson.scheduledDate = nextDate;
                if (completedLesson.startTime) {
                    const originalStartTime = new Date(completedLesson.startTime);
                    const newStartTime = new Date(nextDate);
                    newStartTime.setHours(originalStartTime.getHours(), originalStartTime.getMinutes(), originalStartTime.getSeconds(), originalStartTime.getMilliseconds());
                    completedLesson.startTime = newStartTime;
                }
                if (completedLesson.endTime) {
                    const originalEndTime = new Date(completedLesson.endTime);
                    const newEndTime = new Date(nextDate);
                    newEndTime.setHours(originalEndTime.getHours(), originalEndTime.getMinutes(), originalEndTime.getSeconds(), originalEndTime.getMilliseconds());
                    completedLesson.endTime = newEndTime;
                }
                if (completedLesson.startTime) {
                    const startTime = new Date(completedLesson.startTime);
                    const attendanceStartTime = new Date(startTime.getTime() - 60 * 60 * 1000);
                    completedLesson.attendanceStartTime = attendanceStartTime;
                }
                await this.lessonRepository.save(completedLesson);
            }
        }
        return {
            lesson: {
                ...completedLesson,
                status: lesson_entity_1.LessonStatus.COMPLETED,
            },
        };
    }
    async sendAbsenceNotifications(lessonId, lessonDate) {
        try {
            const lesson = await this.lessonRepository.findOne({
                where: { id: lessonId },
            });
            if (!lesson) {
                return;
            }
            const lessonScheduledDate = new Date(lessonDate);
            const startOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate());
            const endOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId,
                    attendanceTime: (0, typeorm_2.Between)(startOfDay, endOfDay),
                },
                relations: ['student', 'lesson'],
            });
            const absentStudents = attendance.filter((record) => record.status === lesson_attendance_entity_1.AttendanceStatus.ABSENT &&
                record.student?.parentPhoneNumber);
            const notificationPromises = absentStudents.map(async (attendanceRecord) => {
                const student = attendanceRecord.student;
                if (student && student.parentPhoneNumber) {
                    const studentName = `${student.firstName} ${student.lastName}`;
                    return this.whatsAppService.sendAbsenceNotification(student.parentPhoneNumber, studentName, lesson.title, lessonDate, lesson.subject);
                }
            });
            await Promise.all(notificationPromises);
        }
        catch (error) {
            console.error('Error sending absence notifications:', error);
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
                    const daysToAdd = ((targetDay - currentDay + 7) % 7) || 7;
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
                const originalStartTime = new Date(lesson.lesson.startTime);
                const newStartTime = new Date(nextDate);
                newStartTime.setHours(originalStartTime.getHours(), originalStartTime.getMinutes(), originalStartTime.getSeconds(), originalStartTime.getMilliseconds());
                lesson.lesson.startTime = newStartTime;
            }
            if (lesson.lesson.endTime) {
                const originalEndTime = new Date(lesson.lesson.endTime);
                const newEndTime = new Date(nextDate);
                newEndTime.setHours(originalEndTime.getHours(), originalEndTime.getMinutes(), originalEndTime.getSeconds(), originalEndTime.getMilliseconds());
                lesson.lesson.endTime = newEndTime;
            }
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
                status: lesson_entity_1.LessonStatus.SCHEDULED,
            },
            relations: ['teacher', 'students'],
            order: { scheduledDate: 'ASC' },
        });
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
                },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                ...lesson,
                attendanceHistory: attendance,
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async getCompletedLessons() {
        const lessons = await this.lessonRepository.find({
            where: { status: lesson_entity_1.LessonStatus.COMPLETED },
            relations: ['teacher', 'students'],
            order: { scheduledDate: 'DESC' },
        });
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay),
                },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                ...lesson,
                attendanceHistory: attendance,
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async getTeacherTodayLessons(teacherId, subject, status, date) {
        let startOfDay;
        let endOfDay;
        if (date) {
            const targetDate = new Date(date);
            startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
        }
        else {
            const today = new Date();
            startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        }
        if (!teacherId)
            throw new common_1.NotFoundException('Teacher Id Not Sent');
        const whereClause = {
            teacherId: teacherId,
            scheduledDate: (0, typeorm_2.Between)(startOfDay, endOfDay),
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
            const lessonStartOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const lessonEndOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                    createdAt: (0, typeorm_2.Between)(lessonStartOfDay, lessonEndOfDay),
                },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                ...lesson,
                attendanceHistory: attendance,
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async calculateTeacherStats(teacherId, period, startDate, endDate) {
        if (!teacherId)
            throw new common_1.NotFoundException('No TeacherId Found');
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const statsData = await this.teacherStatsService.getTeacherStats(teacherId, period, startDate, endDate);
        const lessons = [];
        const students = [];
        const attendance = [];
        const earnings = [];
        statsData.stats.forEach((stat) => {
            if (stat.totalLessons > 0) {
                lessons.push({
                    date: stat.date,
                    count: stat.totalLessons,
                });
            }
            if (stat.totalStudents > 0) {
                students.push({
                    date: stat.date,
                    count: stat.totalStudents,
                });
            }
            if (stat.totalAttendance > 0) {
                attendance.push({
                    date: stat.date,
                    count: stat.totalAttendance,
                });
            }
            if (stat.totalEarnings > 0) {
                earnings.push({
                    date: stat.date,
                    amount: stat.totalEarnings,
                });
            }
        });
        const totalLessons = lessons.reduce((sum, point) => sum + point.count, 0);
        const totalStudents = students.reduce((sum, point) => sum + point.count, 0);
        const totalAttendance = attendance.reduce((sum, point) => sum + point.count, 0);
        const totalEarnings = earnings.reduce((sum, point) => sum + point.amount, 0);
        const totalCompletedLessons = statsData.stats.reduce((sum, stat) => sum + stat.completedLessons, 0);
        const completionRate = totalLessons > 0 ? (totalCompletedLessons / totalLessons) * 100 : 0;
        const averageEarningsPerLesson = totalLessons > 0 ? totalEarnings / totalLessons : 0;
        const averageStudentsPerLesson = totalLessons > 0 ? totalStudents / totalLessons : 0;
        return {
            teacherId,
            period,
            totalLessons,
            totalStudents,
            totalAttendance,
            totalEarnings,
            averageEarningsPerLesson: Math.round(averageEarningsPerLesson * 100) / 100,
            averageStudentsPerLesson: Math.round(averageStudentsPerLesson * 100) / 100,
            completionRate: Math.round(completionRate * 100) / 100,
            lessons,
            students,
            attendance,
            earnings,
        };
    }
    async getAllTeacherLessons(teacherId) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const lessons = await this.lessonRepository.find({
            where: { teacherId },
            relations: ['teacher', 'students'],
            order: { scheduledDate: 'DESC' },
        });
        await this.checkAndUpdateExpiredLessons(lessons);
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const attendance = await this.attendanceRepository.find({
                where: { lessonId: lesson.id },
                relations: ['student'],
                order: { createdAt: 'ASC' },
            });
            return {
                ...lesson,
                attendanceHistory: attendance,
            };
        }));
        return { lessons: lessonsWithAttendance };
    }
    async initializeTeacherStats(teacherId) {
        await this.teacherStatsService.initializeStatsForTeacher(teacherId);
    }
    async recalculateTeacherStats(teacherId) {
        await this.teacherStatsService.recalculateTeacherStats(teacherId);
    }
    async resetTeacherStats(teacherId) {
        await this.teacherStatsService.clearTeacherStats(teacherId);
        await this.teacherStatsService.recalculateTeacherStats(teacherId);
    }
    async debugTeacherLessons(teacherId) {
        const lessons = await this.lessonRepository.find({
            where: { teacherId },
            relations: ['students'],
        });
        return {
            teacherId,
            totalLessons: lessons.length,
            lessons: lessons.map((lesson) => {
                const lessonDate = lesson.scheduledDate
                    ? new Date(lesson.scheduledDate)
                    : null;
                return {
                    id: lesson.id,
                    title: lesson.title,
                    price: lesson.price,
                    priceType: typeof lesson.price,
                    priceString: lesson.price?.toString(),
                    scheduledDate: lesson.scheduledDate,
                    scheduledDateType: typeof lesson.scheduledDate,
                    scheduledDateISO: lessonDate?.toISOString(),
                    scheduledDateString: lessonDate?.toString(),
                    dateKey: lessonDate ? lessonDate.toISOString().split('T')[0] : null,
                    status: lesson.status,
                    studentsCount: lesson.students.length,
                    students: lesson.students.map((student) => ({
                        id: student.id,
                        firstName: student.firstName,
                        lastName: student.lastName,
                    })),
                };
            }),
        };
    }
    async getTeacherStatsByDate(teacherId, startDate, endDate) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const lessons = await this.lessonRepository.find({
            where: {
                teacherId,
                scheduledDate: (0, typeorm_2.Between)(new Date(startDate), new Date(endDate)),
            },
            relations: ['students'],
        });
        const lessonIds = lessons.map((l) => l.id);
        const attendanceData = await this.attendanceRepository.find({
            where: { lessonId: (0, typeorm_2.In)(lessonIds) },
        });
        const uniqueStudentIds = new Set();
        lessons.forEach((lesson) => {
            lesson.students?.forEach((student) => {
                uniqueStudentIds.add(student.id);
            });
        });
        return {
            teacherId,
            startDate,
            endDate,
            totalLessons: lessons.length,
            totalStudents: uniqueStudentIds.size,
            totalAttendance: attendanceData.length,
            totalEarnings: lessons.reduce((sum, lesson) => sum + parseFloat(lesson.price?.toString() || '0'), 0),
            lessons: lessons.map((lesson) => {
                const lessonDate = lesson.scheduledDate
                    ? new Date(lesson.scheduledDate)
                    : null;
                return {
                    id: lesson.id,
                    title: lesson.title,
                    scheduledDate: lesson.scheduledDate,
                    dateKey: lessonDate ? lessonDate.toISOString().split('T')[0] : null,
                    price: lesson.price,
                    status: lesson.status,
                    studentsCount: lesson.students.length,
                };
            }),
        };
    }
    async getAllLessonsForTeacher(teacherId) {
        const lessons = await this.lessonRepository.find({
            where: { teacherId },
            relations: ['students'],
            order: { scheduledDate: 'DESC' },
        });
        return {
            teacherId,
            totalLessons: lessons.length,
            lessons: lessons.map((lesson) => {
                const lessonDate = lesson.scheduledDate
                    ? new Date(lesson.scheduledDate)
                    : null;
                return {
                    id: lesson.id,
                    title: lesson.title,
                    scheduledDate: lesson.scheduledDate,
                    scheduledDateType: typeof lesson.scheduledDate,
                    scheduledDateISO: lessonDate?.toISOString(),
                    dateKey: lessonDate ? lessonDate.toISOString().split('T')[0] : null,
                    hours: lessonDate ? lessonDate.getHours() : null,
                    minutes: lessonDate ? lessonDate.getMinutes() : null,
                    status: lesson.status,
                    studentsCount: lesson.students.length,
                };
            }),
        };
    }
    async markAbsentStudentsWithoutAttendance(lessonId) {
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['students'],
        });
        if (!lesson) {
            return;
        }
        const lessonScheduledDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate());
        const endOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate(), 23, 59, 59, 999);
        const existingAttendance = await this.attendanceRepository.find({
            where: {
                lessonId,
                attendanceTime: (0, typeorm_2.Between)(startOfDay, endOfDay),
            },
        });
        const studentsWithoutAttendance = lesson.students.filter((student) => !existingAttendance.some((attendance) => attendance.studentId === student.id));
        const now = new Date();
        for (const student of studentsWithoutAttendance) {
            const attendance = this.attendanceRepository.create({
                lessonId,
                studentId: student.id,
                status: lesson_attendance_entity_1.AttendanceStatus.ABSENT,
                createdAt: now,
                attendanceTime: lessonScheduledDate,
                markedBy: 'system',
            });
            await this.attendanceRepository.save(attendance);
            await this.studentservice.logAbsence(student.id, lesson.title);
        }
    }
    async debugLessonData(lessonId) {
        const lesson = await this.lessonRepository.findOne({
            where: { id: lessonId },
            relations: ['teacher', 'students'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const allAttendance = await this.attendanceRepository.find({
            where: { lessonId },
            relations: ['student'],
        });
        const lessonScheduledDate = new Date(lesson.scheduledDate);
        const startOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate());
        const endOfDay = new Date(lessonScheduledDate.getFullYear(), lessonScheduledDate.getMonth(), lessonScheduledDate.getDate(), 23, 59, 59, 999);
        const currentOccurrenceAttendance = allAttendance.filter((record) => {
            const attendanceTime = new Date(record.attendanceTime);
            return attendanceTime >= startOfDay && attendanceTime <= endOfDay;
        });
        return {
            lessonId: lesson.id,
            title: lesson.title,
            pricingType: lesson.pricingType,
            price: lesson.price,
            priceType: typeof lesson.price,
            priceString: lesson.price?.toString(),
            scheduledDate: lesson.scheduledDate,
            scheduledDateType: typeof lesson.scheduledDate,
            teacherId: lesson.teacherId,
            studentsCount: lesson.students?.length || 0,
            students: lesson.students?.map((s) => ({
                id: s.id,
                firstName: s.firstName,
                lastName: s.lastName,
            })) || [],
            status: lesson.status,
            recurrenceType: lesson.recurrenceType,
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt,
            totalAttendanceRecords: allAttendance.length,
            currentOccurrenceAttendanceCount: currentOccurrenceAttendance.length,
            allAttendance: allAttendance.map((record) => ({
                id: record.id,
                studentId: record.studentId,
                studentName: record.student
                    ? `${record.student.firstName} ${record.student.lastName}`
                    : 'Unknown',
                status: record.status,
                attendanceTime: record.attendanceTime,
                createdAt: record.createdAt,
                markedBy: record.markedBy,
            })),
            currentOccurrenceAttendance: currentOccurrenceAttendance.map((record) => ({
                id: record.id,
                studentId: record.studentId,
                studentName: record.student
                    ? `${record.student.firstName} ${record.student.lastName}`
                    : 'Unknown',
                status: record.status,
                attendanceTime: record.attendanceTime,
                createdAt: record.createdAt,
                markedBy: record.markedBy,
            })),
            dateRange: {
                lessonDate: lessonScheduledDate.toISOString(),
                startOfDay: startOfDay.toISOString(),
                endOfDay: endOfDay.toISOString(),
            },
        };
    }
};
exports.LessonService = LessonService;
exports.LessonService = LessonService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assistant_entity_1.Assistant)),
    __param(1, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(2, (0, typeorm_1.InjectRepository)(lesson_attendance_entity_1.LessonAttendance)),
    __param(3, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(4, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(5, (0, typeorm_1.InjectRepository)(section_entity_1.Section)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        user_service_1.UserService,
        teacher_stats_service_1.TeacherStatsService,
        whatsapp_service_1.WhatsAppService,
        student_service_1.StudentService])
], LessonService);
//# sourceMappingURL=lesson.service.js.map