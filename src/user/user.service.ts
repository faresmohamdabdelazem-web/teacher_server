import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { CreateUserDto } from './dto/create-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddUserReviewDto } from './dto/add-user-review.dto';
import { ulid } from 'ulid';
import { extractPublicId } from 'src/shared/extract-public-id';
import { UserPayload } from './userPayload.type';
import { FilterUsersDto } from './dto/filter-user.dto';
import { UserRole } from './user.role.enum';
import {
  comparePassword,
  hashPasswordSync,
} from 'src/decorators/password/helper';
import { PASSPORT_PHOTO_FILE, PROFILE_PHOTO_FILE } from 'src/hatly.constants';
import { isURL } from 'class-validator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { plainToClass } from 'class-transformer';
import { TeacherService } from './teacher/teacher.service';
import { AssistantService } from './assistant/assistant.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cloudinary: CloudinaryService,
    private teacherService: TeacherService,
    private assistantService: AssistantService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    console.log('Creating user with password:', createUserDto.password);

    // Transform the DTO to ensure decorators are applied
    const transformedDto = plainToClass(CreateUserDto, createUserDto);
    console.log('Transformed DTO password:', transformedDto.password);

    const user = this.userRepository.create(transformedDto);
    console.log('User created with password:', user.password);

    const savedUser = await this.userRepository.save(user).catch((error) => {
      console.log(error);
      if (error.detail.includes(user.email) && error.code == '23505')
        throw new ConflictException(`Email '${user.email}' is already exists`);
      throw new InternalServerErrorException();
    });
    
    console.log('User saved with password:', savedUser.password);

    // Create Teacher or Assistant entity if applicable
    if (savedUser.role === UserRole.TEACHER) {
      await this.teacherService.createWithUser(savedUser);
    } else if (savedUser.role === UserRole.ASSISTANT) {
      await this.assistantService.createWithUser(savedUser);
    }

    return savedUser;
  }

  /**
   * Converts a base64 string to a Buffer
   * @param base64String - The base64 string to convert
   * @returns Buffer containing the decoded data
   */
  private base64ToBuffer(base64String: string): Buffer {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }


  async findAll(paginatedRequestDto: FilterUsersDto) {
    const {
      page,
      take,
      email,
      city,
      country,
      verify,
      role,
      dateOfBirth,
      phone,
    } = paginatedRequestDto;

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

  async findOneByEmail(value: string) {
    return await this.userRepository.findOne({
      where: [
        { email: value },
        // { id: value }
      ],
    });
  }

  async findOneById(value: string) {
    return await this.userRepository.findOne({
      where: { userId: value },
    });
  }

  async isValidOtp(otp: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        otpToken: otp,
        otpExp: MoreThan(Date.now()),
      },
    });
  }


  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
    signedUser?: UserPayload,
  ): Promise<{ user: User }> {
    if (signedUser && signedUser.id !== userId && signedUser.role !== 'admin') {
      throw new NotFoundException('Unauthorized to update this user');
    }

    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, { ...updateUserDto });

    const savedUser = await this.userRepository.save(user);
  
    
    return { user: savedUser };
  }

  async findOne(userId: string) {
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
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        ...user,
      }
    };
  }

  async remove(userId: string) {
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }



    const [deletedData] = await Promise.all([
      this.userRepository.delete(userId),
    ]);



    // Handle potential data deletion errors gracefully
    if (deletedData.affected === 0) {
      Logger.error('Failed to delete user from database');
      throw new InternalServerErrorException('Failed to delete user');
    }

    return { message: 'User deleted successfully' };
  }

  async changePassword(changePassword: ChangePasswordDto, userId: string) {
    const currentUser = await this.userRepository.findOne({
      where: { userId },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (!comparePassword(changePassword.oldPassword, currentUser.password)) {
      throw new ConflictException('Old password is incorrect');
    }

    await this.userRepository.update(currentUser.userId, {
      password: changePassword.newPassword,
    });

    return { message: 'Password changed successfully' };
  }

  async createAdmin() {
    const ADMIN_EMAIL = 'admin@hatly.com';
    const ADMIN_PASSWORD = hashPasswordSync('123456');

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
      role: UserRole.ADMIN,
    });

    return this.userRepository.save(admin);
  }

  async createFakeUsers() {
    if ((await this.userRepository.count()) > 3) return;
    for (let i = 0; i < 15; i++) {
      const fakeUser = {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        fcmToken: faker.string.alphanumeric(),
        profilePhoto: faker.image.urlLoremFlickr({ category: 'people' }),
        verify: false,
        role: UserRole.CUSTOMER,
      };
      const user = this.userRepository.create(fakeUser);
      this.userRepository.save(user);
    }
    Logger.log('FAKE USERS CREATED');
  }
}
