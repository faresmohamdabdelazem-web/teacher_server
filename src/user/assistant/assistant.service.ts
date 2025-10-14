import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assistant } from './assistant.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AssistantService {
  constructor(
    @InjectRepository(Assistant)
    private assistantRepository: Repository<Assistant>,
  ) {}

 async createWithUser(user: User, branchId?: string) {
  const assistant = this.assistantRepository.create({
    userId: user.userId,
    user,
    branchId: branchId || null,
  });
  return await this.assistantRepository.save(assistant);
}

  async createWithUserAndTeacher(user: User, teacherId: string) {
    const assistant = this.assistantRepository.create({ 
      userId: user.userId, 
      user,
      teacherId
    });
    return await this.assistantRepository.save(assistant);
  }

  async findByTeacher(teacherId: string): Promise<Assistant[]> {
    return await this.assistantRepository.find({
      where: { teacherId },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<Assistant | null> {
    return await this.assistantRepository.findOne({
      where: { userId },
      relations: ['user', 'branch'],
    });
  }
} 