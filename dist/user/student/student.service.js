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
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("./student.entity");
const cloudinary_service_1 = require("../../cloudinary/cloudinary.service");
const hatly_constants_1 = require("../../hatly.constants");
let StudentService = class StudentService {
    constructor(studentRepository, cloudinary) {
        this.studentRepository = studentRepository;
        this.cloudinary = cloudinary;
    }
    async create(createStudentDto) {
        if (createStudentDto.phoneNumber) {
            const existingStudent = await this.studentRepository.findOne({
                where: { phoneNumber: createStudentDto.phoneNumber },
            });
            if (existingStudent) {
                throw new common_1.ConflictException('Student with this phone number already exists');
            }
        }
        let manualEntryId = createStudentDto.manualEntryId;
        if (manualEntryId) {
            const existingManualId = await this.studentRepository.findOne({ where: { manualEntryId } });
            if (existingManualId) {
                throw new common_1.ConflictException('Student with this manualEntryId already exists');
            }
        }
        else {
            const maxRetries = 10;
            let retryCount = 0;
            let isUnique = false;
            while (!isUnique && retryCount < maxRetries) {
                manualEntryId = Math.floor(1000000 + Math.random() * 9000000).toString();
                const existingManualId = await this.studentRepository.findOne({ where: { manualEntryId } });
                if (!existingManualId) {
                    isUnique = true;
                }
                retryCount++;
            }
            if (!isUnique) {
                throw new common_1.ConflictException('Unable to generate unique manualEntryId after maximum retries');
            }
        }
        let profilePhotoUrl = createStudentDto.profilePhoto;
        console.log(profilePhotoUrl);
        if (profilePhotoUrl && !profilePhotoUrl.startsWith('http')) {
            profilePhotoUrl = await this.cloudinary.uploadBase64(profilePhotoUrl, hatly_constants_1.PROFILE_PHOTO_FILE, `student_${createStudentDto.phoneNumber || Date.now()}`);
        }
        const student = this.studentRepository.create({
            ...createStudentDto,
            profilePhoto: profilePhotoUrl,
            manualEntryId,
        });
        console.log(student);
        const savedStudent = await this.studentRepository.save(student);
        console.log(savedStudent);
        return savedStudent;
    }
    async findAll() {
        const students = await this.studentRepository.find({
            relations: ['teachers', 'lessons'],
        });
        return { students };
    }
    async findOne(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['teachers', 'lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { student };
    }
    async findByPhoneNumber(phoneNumber) {
        const student = await this.studentRepository.findOne({
            where: { phoneNumber: phoneNumber },
            relations: ['teachers', 'lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { student };
    }
    async findById(id) {
        const student = await this.studentRepository.findOne({
            where: { id: id },
            relations: ['teachers', 'lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { student };
    }
    async update(id, updateStudentDto) {
        const student = await this.findOne(id);
        if (updateStudentDto.id && updateStudentDto.id !== student.student.id) {
            const existingStudent = await this.studentRepository.findOne({
                where: { id: updateStudentDto.id },
            });
            if (!existingStudent) {
                throw new common_1.ConflictException('Student with this studentId not found');
            }
        }
        Object.assign(student.student, updateStudentDto);
        return await this.studentRepository.save(student.student);
    }
    async remove(id) {
        const student = await this.findOne(id);
        await this.studentRepository.remove(student.student);
    }
    async getStudentTeachers(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['teachers'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { teachers: student.teachers };
    }
    async getStudentLessons(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { lessons: student.lessons };
    }
    async findByManualEntryId(manualEntryId) {
        const student = await this.studentRepository.findOne({
            where: { manualEntryId: manualEntryId },
            relations: ['teachers', 'lessons'],
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        return { student };
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cloudinary_service_1.CloudinaryService])
], StudentService);
//# sourceMappingURL=student.service.js.map