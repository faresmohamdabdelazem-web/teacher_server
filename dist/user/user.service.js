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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const faker_1 = require("@faker-js/faker");
const create_user_dto_1 = require("./dto/create-user.dto");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const typeorm_2 = require("typeorm");
const user_role_enum_1 = require("./user.role.enum");
const helper_1 = require("../decorators/password/helper");
const class_transformer_1 = require("class-transformer");
const teacher_service_1 = require("./teacher/teacher.service");
const assistant_service_1 = require("./assistant/assistant.service");
let UserService = class UserService {
    constructor(userRepository, cloudinary, teacherService, assistantService) {
        this.userRepository = userRepository;
        this.cloudinary = cloudinary;
        this.teacherService = teacherService;
        this.assistantService = assistantService;
    }
    async create(createUserDto) {
        console.log('Creating user with password:', createUserDto.password);
        const transformedDto = (0, class_transformer_1.plainToClass)(create_user_dto_1.CreateUserDto, createUserDto);
        console.log('Transformed DTO password:', transformedDto.password);
        const user = this.userRepository.create(transformedDto);
        console.log('User created with password:', user.password);
        const savedUser = await this.userRepository.save(user).catch((error) => {
            console.log(error);
            if (error.detail.includes(user.email) && error.code == '23505')
                throw new common_1.ConflictException(`Email '${user.email}' is already exists`);
            throw new common_1.InternalServerErrorException();
        });
        console.log('User saved with password:', savedUser.password);
        if (savedUser.role === user_role_enum_1.UserRole.TEACHER) {
            await this.teacherService.createWithUser(savedUser);
        }
        else if (savedUser.role === user_role_enum_1.UserRole.ASSISTANT) {
            await this.assistantService.createWithUser(savedUser);
        }
        return savedUser;
    }
    base64ToBuffer(base64String) {
        const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    }
    async findAll(paginatedRequestDto) {
        const { page, take, email, city, country, verify, role, dateOfBirth, phone, } = paginatedRequestDto;
        const skip = (page - 1) * take;
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.phone', 'phone')
            .where('1 = 1');
        if (email) {
            queryBuilder.andWhere('user.email = :email', { email });
        }
        if (country) {
            queryBuilder.andWhere('user.country = :country', { country });
        }
        if (city) {
            queryBuilder.andWhere('user.city = :city', { city });
        }
        if (verify == false || verify == true) {
            queryBuilder.andWhere('user.verify = :verify', { verify });
        }
        if (role) {
            queryBuilder.andWhere('user.role = :role', { role });
        }
        if (dateOfBirth) {
            queryBuilder.andWhere('user.dateOfBirth = :dateOfBirth', { dateOfBirth });
        }
        if (phone) {
            console.log(phone);
            queryBuilder.andWhere('user.phone = :phone', { phone });
        }
        const [users, totalData] = await Promise.all([
            queryBuilder.skip(skip).take(take).getMany(),
            queryBuilder.getCount(),
        ]);
        const totalPages = Math.ceil(totalData / take);
        return {
            users,
            meta: {
                page,
                limit: take,
                total: totalData,
                totalPages,
            }
        };
    }
    async getUserCount() {
        return {
            count: await this.userRepository.count(),
        };
    }
    async findOneByEmail(value) {
        return await this.userRepository.findOne({
            where: [
                { email: value },
            ],
        });
    }
    async findOneById(value) {
        return await this.userRepository.findOne({
            where: { userId: value },
        });
    }
    async isValidOtp(otp) {
        return await this.userRepository.findOne({
            where: {
                otpToken: otp,
                otpExp: (0, typeorm_2.MoreThan)(Date.now()),
            },
        });
    }
    async update(userId, updateUserDto, signedUser) {
        if (signedUser && signedUser.id !== userId && signedUser.role !== 'admin') {
            throw new common_1.NotFoundException('Unauthorized to update this user');
        }
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        Object.assign(user, { ...updateUserDto });
        const savedUser = await this.userRepository.save(user);
        return { user: savedUser };
    }
    async findOne(userId) {
        const user = await this.userRepository.findOne({
            where: { userId },
            select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            user: {
                ...user,
            }
        };
    }
    async remove(userId) {
        const user = await this.userRepository.findOne({ where: { userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const [deletedData] = await Promise.all([
            this.userRepository.delete(userId),
        ]);
        if (deletedData.affected === 0) {
            common_1.Logger.error('Failed to delete user from database');
            throw new common_1.InternalServerErrorException('Failed to delete user');
        }
        return { message: 'User deleted successfully' };
    }
    async changePassword(changePassword, userId) {
        const currentUser = await this.userRepository.findOne({
            where: { userId },
        });
        if (!currentUser) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!(0, helper_1.comparePassword)(changePassword.oldPassword, currentUser.password)) {
            throw new common_1.ConflictException('Old password is incorrect');
        }
        await this.userRepository.update(currentUser.userId, {
            password: changePassword.newPassword,
        });
        return { message: 'Password changed successfully' };
    }
    async createAdmin() {
        const ADMIN_EMAIL = 'admin@hatly.com';
        const ADMIN_PASSWORD = (0, helper_1.hashPasswordSync)('123456');
        const existingAdmin = await this.userRepository.findOneBy({
            email: ADMIN_EMAIL,
        });
        if (existingAdmin) {
            return existingAdmin;
        }
        const admin = this.userRepository.create({
            email: ADMIN_EMAIL,
            firstName: 'Hatly',
            lastName: '',
            password: ADMIN_PASSWORD,
            role: user_role_enum_1.UserRole.ADMIN,
        });
        return this.userRepository.save(admin);
    }
    async createFakeUsers() {
        if ((await this.userRepository.count()) > 3)
            return;
        for (let i = 0; i < 15; i++) {
            const fakeUser = {
                firstName: faker_1.faker.person.firstName(),
                lastName: faker_1.faker.person.lastName(),
                email: faker_1.faker.internet.email(),
                fcmToken: faker_1.faker.string.alphanumeric(),
                profilePhoto: faker_1.faker.image.urlLoremFlickr({ category: 'people' }),
                verify: false,
                role: user_role_enum_1.UserRole.CUSTOMER,
            };
            const user = this.userRepository.create(fakeUser);
            this.userRepository.save(user);
        }
        common_1.Logger.log('FAKE USERS CREATED');
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cloudinary_service_1.CloudinaryService,
        teacher_service_1.TeacherService,
        assistant_service_1.AssistantService])
], UserService);
//# sourceMappingURL=user.service.js.map