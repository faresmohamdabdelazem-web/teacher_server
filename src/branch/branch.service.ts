import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Section } from 'src/section/entities/section.entity';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(Section) // --- إضافة: للوصول لجدول الأقسام ---
    private sectionRepository: Repository<Section>,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const existingBranch = await this.branchRepository.findOneBy({
      name: createBranchDto.name,
    });
    if (existingBranch) {
      throw new ConflictException(
        `Branch with name "${createBranchDto.name}" already exists`,
      );
    }
    const branch = this.branchRepository.create(createBranchDto);
    return this.branchRepository.save(branch);
  }

  async findAll(): Promise<Branch[]> {
    // --- تعديل: لجلب الأقسام مع الفروع ---
    return this.branchRepository.find({ relations: ['students', 'sections'] });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      // --- تعديل: لجلب الأقسام مع الفرع ---
      relations: ['students', 'sections'],
    });
    if (!branch) {
      throw new NotFoundException(`Branch with ID "${id}" not found`);
    }
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);
    if (updateBranchDto.name && updateBranchDto.name !== branch.name) {
      const existingBranch = await this.branchRepository.findOneBy({
        name: updateBranchDto.name,
      });
      if (existingBranch) {
        throw new ConflictException(
          `Branch with name "${updateBranchDto.name}" already exists`,
        );
      }
    }
    Object.assign(branch, updateBranchDto);
    return this.branchRepository.save(branch);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    await this.branchRepository.remove(branch);
  }

  // --- بداية الإضافة: دالة لربط قسم بفرع ---
  async addSectionToBranch(branchId: string, sectionId: string): Promise<Branch> {
    const branch = await this.findOne(branchId);
    const section = await this.sectionRepository.findOneBy({ id: sectionId });

    if (!section) {
      throw new NotFoundException(`Section with ID "${sectionId}" not found`);
    }

    const sectionExists = branch.sections.some((s) => s.id === section.id);
    if (sectionExists) {
      throw new ConflictException('This section is already added to the branch');
    }

    branch.sections.push(section);
    return this.branchRepository.save(branch);
  }
  // --- نهاية الإضافة ---

  // --- بداية الإضافة: دالة لإزالة ربط قسم بفرع ---
  async removeSectionFromBranch(branchId: string, sectionId: string): Promise<void> {
    const branch = await this.findOne(branchId);
    
    branch.sections = branch.sections.filter((section) => section.id !== sectionId);

    await this.branchRepository.save(branch);
  }
  // --- نهاية الإضافة ---
}