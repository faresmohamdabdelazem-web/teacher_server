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

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  /**
   * إنشاء فرع جديد
   */
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

  /**
   * جلب جميع الفروع مع الطلاب المرتبطين بها
   */
  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({ relations: ['students'] });
  }

  /**
   * جلب فرع واحد عن طريق الـ ID
   */
  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['students'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID "${id}" not found`);
    }
    return branch;
  }

  /**
   * تحديث بيانات فرع
   */
  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id); // التحقق من وجود الفرع أولاً

    // التحقق من أن الاسم الجديد (إذا تم توفيره) غير مستخدم من قبل فرع آخر
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

  /**
   * حذف فرع
   */
  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id); // التحقق من وجود الفرع
    await this.branchRepository.remove(branch);
  }
}