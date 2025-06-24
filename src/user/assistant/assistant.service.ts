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

  async createWithUser(user: User) {
    const assistant = this.assistantRepository.create({ userId: user.userId, user });
    return await this.assistantRepository.save(assistant);
  }
} 