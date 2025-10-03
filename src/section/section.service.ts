import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from './entities/section.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
  ) {}

  async create(createSectionDto: CreateSectionDto): Promise<Section> {
    const existing = await this.sectionRepository.findOneBy({
      name: createSectionDto.name,
    });
    if (existing) {
      throw new ConflictException(
        `Section with name "${createSectionDto.name}" already exists`,
      );
    }
    const section = this.sectionRepository.create(createSectionDto);
    return this.sectionRepository.save(section);
  }

  async findAll(): Promise<Section[]> {
    return this.sectionRepository.find({ relations: ['branches'] });
  }

  async findOne(id: string): Promise<Section> {
    const section = await this.sectionRepository.findOne({
      where: { id },
      relations: ['branches'],
    });
    if (!section) {
      throw new NotFoundException(`Section with ID "${id}" not found`);
    }
    return section;
  }

  async update(id: string, updateSectionDto: UpdateSectionDto): Promise<Section> {
    const section = await this.findOne(id);

    if (updateSectionDto.name && updateSectionDto.name !== section.name) {
      const existing = await this.sectionRepository.findOneBy({
        name: updateSectionDto.name,
      });
      if (existing) {
        throw new ConflictException(
          `Section with name "${updateSectionDto.name}" already exists`,
        );
      }
    }

    Object.assign(section, updateSectionDto);
    return this.sectionRepository.save(section);
  }

  async remove(id: string): Promise<void> {
    const result = await this.sectionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Section with ID "${id}" not found`);
    }
  }
}