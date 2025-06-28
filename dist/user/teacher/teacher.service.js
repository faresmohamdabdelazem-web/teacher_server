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
exports.TeacherService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const teacher_entity_1 = require("./teacher.entity");
const student_entity_1 = require("../student/student.entity");
const class_validator_1 = require("class-validator");
const lesson_entity_1 = require("../../lesson/entities/lesson.entity");
const user_entity_1 = require("../../user/entities/user.entity");
const user_role_enum_1 = require("../user.role.enum");
const lesson_attendance_entity_1 = require("../../lesson/entities/lesson-attendance.entity");
let TeacherService = class TeacherService {
    constructor(teacherRepository, studentRepository, lessonRepository, userRepository, attendanceRepository) {
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.lessonRepository = lessonRepository;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
    }
    async create(createTeacherDto, user) {
        const teacher = this.teacherRepository.create({ id: user.userId, user });
        return await this.teacherRepository.save(teacher);
    }
    async findAll() {
        const teachers = await this.userRepository.find({
            where: { role: user_role_enum_1.UserRole.TEACHER },
            relations: ['lessons', 'students'],
        });
        return { teachers };
    }
    async findOne(userId) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: userId },
            relations: ['user', 'lessons'],
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        return teacher;
    }
    async update(userId, updateTeacherDto) {
        const teacher = await this.findOne(userId);
        Object.assign(teacher, updateTeacherDto);
        return await this.teacherRepository.save(teacher);
    }
    async remove(userId) {
        const teacher = await this.findOne(userId);
        await this.teacherRepository.remove(teacher);
    }
    async getTeacherStudents(userId) {
        if (!(0, class_validator_1.isUUID)(userId)) {
            throw new common_1.BadRequestException('Invalid teacher ID');
        }
        const teacher = await this.teacherRepository.findOne({
            where: { id: userId },
            relations: ['students'],
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const students = await this.studentRepository.find({
            where: { teachers: { id: userId } },
            relations: ['teachers', 'lessons'],
        });
        const studentsWithLessons = await Promise.all(students.map(async (student) => {
            const lessonsWithAttendance = await Promise.all(student.lessons.map(async (lesson) => {
                const lessonDate = new Date(lesson.scheduledDate);
                const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
                const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
                const attendance = await this.attendanceRepository.find({
                    where: {
                        lessonId: lesson.id,
                        createdAt: (0, typeorm_2.Between)(startOfDay, endOfDay)
                    },
                    relations: ['student'],
                    order: { createdAt: 'ASC' }
                });
                return {
                    ...lesson,
                    attendanceHistory: attendance
                };
            }));
            return {
                ...student,
                lessons: lessonsWithAttendance
            };
        }));
        return {
            students: studentsWithLessons,
        };
    }
    async getTeacherLessons(userId) {
        if (!(0, class_validator_1.isUUID)(userId)) {
            throw new common_1.BadRequestException('Invalid teacher ID');
        }
        const teacher = await this.teacherRepository.findOne({
            where: { id: userId },
            relations: ['students'],
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        const lessons = await this.lessonRepository.find({
            where: { teacher: { id: userId } },
            relations: ['teacher', 'students'],
        });
        const lessonsWithAttendance = await Promise.all(lessons.map(async (lesson) => {
            const lessonDate = new Date(lesson.scheduledDate);
            const startOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
            const endOfDay = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate(), 23, 59, 59, 999);
            const attendance = await this.attendanceRepository.find({
                where: {
                    lessonId: lesson.id,
                },
                relations: ['student'],
                order: { createdAt: 'ASC' }
            });
            return {
                ...lesson,
                attendanceHistory: attendance
            };
        }));
        return {
            lessons: lessonsWithAttendance,
        };
    }
    async createWithUser(user) {
        const teacher = this.teacherRepository.create({ id: user.userId, user });
        return await this.teacherRepository.save(teacher);
    }
    async addStudentToTeacher(teacherId, studentId) {
        const teacher = await this.teacherRepository.findOne({
            where: { id: teacherId },
            relations: ['students'],
        });
        if (!teacher)
            throw new common_1.NotFoundException('Teacher not found');
        const student = await this.studentRepository.findOne({ where: { id: studentId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        if (!teacher.students.some(s => s.id === studentId)) {
            teacher.students.push(student);
            await this.teacherRepository.save(teacher);
        }
    }
};
exports.TeacherService = TeacherService;
exports.TeacherService = TeacherService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(lesson_entity_1.Lesson)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(lesson_attendance_entity_1.LessonAttendance)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TeacherService);
//# sourceMappingURL=teacher.service.js.map