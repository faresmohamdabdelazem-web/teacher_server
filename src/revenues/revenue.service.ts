import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Revenue, RevenueSource } from './entities/revenues.entity';
import { Section } from 'src/section/entities/section.entity';
import { Branch } from 'src/branch/entities/branch.entity';
import { Student } from 'src/user/student/student.entity';
import { In } from 'typeorm';
@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(Revenue)
    private revenueRepository: Repository<Revenue>,
        @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>
  ) { }
  async create(data: {
    amount: number;
    source: RevenueSource;
    studentId: string;
    sectionId: string;
    branchId?: string
    installmentId?: string;
  }): Promise<Revenue> {
    const revenue = this.revenueRepository.create(data);
    return this.revenueRepository.save(revenue);
  }
  // جلب كل الإيرادات مع معلومات الطالب والقسم
  async findAll(): Promise<Revenue[]> {
    return this.revenueRepository.find({
      relations: ['student', 'student.section', 'student.branch'],
      order: { createdAt: 'DESC' },
    });
  }

  // endpoint لحساب إجمالي الإيرادات
  async getTotalRevenue(): Promise<{ totalRevenue: number }> {
    const { total } = await this.revenueRepository
      .createQueryBuilder('revenue')
      .select('SUM(revenue.amount)', 'total')
      .getRawOne();
    return { totalRevenue: parseFloat(total) || 0 };
  }

  // endpoint لحساب إجمالي إيرادات قسم معين
  async getRevenueBySection(sectionId: string): Promise<{ sectionName: string; totalRevenue: number }> {
    const section = await this.sectionRepository.findOneBy({ id: sectionId });
    if (!section) {
      throw new NotFoundException(`Section with ID "${sectionId}" not found`);
    }

    const { total } = await this.revenueRepository
      .createQueryBuilder('revenue')
      .where('revenue.sectionId = :sectionId', { sectionId })
      .select('SUM(revenue.amount)', 'total')
      .getRawOne();

    return {
      sectionName: section.nameAr || section.name,
      totalRevenue: parseFloat(total) || 0,
    };
  }

  // يمكنك أيضاً عمل endpoint يجمع كل إيرادات الأقسام
  async getAllSectionsRevenue(): Promise<{ sectionName: string; totalRevenue: number }[]> {
    const sections = await this.sectionRepository.find();
    const revenuesBySection = [];

    for (const section of sections) {
      const { total } = await this.revenueRepository
        .createQueryBuilder('revenue')
        .where('revenue.sectionId = :sectionId', { sectionId: section.id })
        .select('SUM(revenue.amount)', 'total')
        .getRawOne();

      revenuesBySection.push({
        sectionName: section.nameAr || section.name,
        totalRevenue: parseFloat(total) || 0,
      });
    }

    return revenuesBySection;
  }

async getRevenueSummary(
  branchId?: string,
  sectionId?: string,
): Promise<{
  students: {
    id: string;
    name: string;
    downPayment: number;
    completedInstallments: number;
  }[];
  totalBranchesRevenue: number;
  alexTotalRevenue: number;
  cairoTotalRevenue: number;
  totalSectionsStudents: {
    nursing: number;
    radiology: number;
    hospitality: number;
  };
  totalStudents: number;
}> {
  // ✅ تحقق من وجود الفرع لو مبعوت
  if (branchId) {
    const branchExists = await this.branchRepository.findOneBy({ id: branchId });
    if (!branchExists)
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
  }

  // ✅ الفلترة الديناميكية للطلبة (بالفرع والسكشن)
  const studentQuery = this.studentRepository
    .createQueryBuilder('student')
    .leftJoinAndSelect('student.branch', 'branch')
    .leftJoinAndSelect('student.section', 'section')
    .leftJoinAndSelect('student.installments', 'installments');

  if (branchId) {
    studentQuery.andWhere('student.branchId = :branchId', { branchId });
  }

  if (sectionId) {
    const keyword = decodeURIComponent(sectionId).trim();
    studentQuery.andWhere('section.name ILIKE :keyword', { keyword: `%${keyword}%` });
  }

  const studentsData = await studentQuery.getMany();

  // ✅ تجهيز بيانات الطلبة
  const students = studentsData.map((s) => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    downPayment: s.downPayment ?? 0,
    completedInstallments:
      s.installments?.filter((i) => i.remainingAmount === 0).length || 0,
  }));

  // ✅ حساب الإيرادات للفروع
  const allBranches = await this.branchRepository.find();
  const branchRevenues = await this.revenueRepository
    .createQueryBuilder('revenue')
    .select('revenue.branchId', 'branchId')
    .addSelect('SUM(revenue.amount)', 'total')
    .groupBy('revenue.branchId')
    .getRawMany();

  let alexTotalRevenue = 0;
  let cairoTotalRevenue = 0;
  const branchMap = new Map(allBranches.map((b) => [b.id, b]));

  for (const revenue of branchRevenues) {
    const branch = branchMap.get(revenue.branchId);
    if (branch) {
      const total = parseFloat(revenue.total) || 0;
      const branchName = branch.nameAr || branch.name;
      if (branchName.includes('اسكندرية')) alexTotalRevenue += total;
      else if (branchName.includes('قاهرة')) cairoTotalRevenue += total;
    }
  }

  const totalBranchesRevenue = alexTotalRevenue + cairoTotalRevenue;

  // ✅ حساب أعداد السكاشن بناءً على الفرع فقط (مش السكشن)
  const sectionCountsQuery = this.studentRepository
    .createQueryBuilder('student')
    .leftJoin('student.section', 'section')
    .select('section.name', 'sectionName')
    .addSelect('COUNT(student.id)', 'count');

  if (branchId) {
    sectionCountsQuery.andWhere('student.branchId = :branchId', { branchId });
  }

  // ❌ متضيفش فلتر sectionId هنا علشان الأرقام تعتمد على الفرع فقط
  sectionCountsQuery.groupBy('section.name');
  const sectionCounts = await sectionCountsQuery.getRawMany();

  const totalSectionsStudents = {
    nursing: 0,
    radiology: 0,
    hospitality: 0,
  };

  for (const item of sectionCounts) {
    const name = item.sectionName?.trim() || '';
    const count = parseInt(item.count, 10) || 0;

    if (name.includes('Nursing Department')) totalSectionsStudents.nursing += count;
    else if (name.includes('Radiology Department') || name.includes('Laboratory'))
      totalSectionsStudents.radiology += count;
    else if (name.includes('Hospitality Department') || name.includes('Aviation'))
      totalSectionsStudents.hospitality += count;
  }

  // ✅ حساب إجمالي الطلاب لنفس الفرع فقط (مش السكشن)
  const totalStudents = await this.studentRepository.count({
    where: branchId ? { branch: { id: branchId } } : {},
  });

  return {
    students,
    totalBranchesRevenue,
    alexTotalRevenue,
    cairoTotalRevenue,
    totalStudents,
    totalSectionsStudents,
  };
}










// async getRevenueByBranch(branchId: string): Promise<{ branchName: string; totalRevenue: number; totalAllBranches: number }> {
//   // جلب الفرع بالـ ID
//   const branch = await this.branchRepository.findOneBy({ id: branchId });
//   if (!branch) {
//     throw new NotFoundException(`Branch with ID "${branchId}" not found`);
//   }

//   // إجمالي إيرادات هذا الفرع
//   const { total } = await this.revenueRepository
//     .createQueryBuilder('revenue')
//     .where('revenue.branchId = :branchId', { branchId })
//     .select('SUM(revenue.amount)', 'total')
//     .getRawOne();




//   return {
//     branchName: branch.nameAr || branch.name,
//     totalRevenue: parseFloat(total) || 0
    
//   };
// }



async getAllBranchesRevenue(): Promise<{ totalAll: number; revenuesByBranch: { branchName: string; totalRevenue: number }[] }> {
  const branches = await this.branchRepository.find();
  const revenuesByBranch: { branchName: string; totalRevenue: number }[] = [];

  for (const branch of branches) {
    const { total } = await this.revenueRepository
      .createQueryBuilder('revenue')
      .where('revenue.branchId = :branchId', { branchId: branch.id })
      .select('SUM(revenue.amount)', 'total')
      .getRawOne();

    revenuesByBranch.push({
      branchName: branch.nameAr || branch.name,
      totalRevenue: parseFloat(total) || 0,
    });
  }

  const { total: totalAll } = await this.revenueRepository
    .createQueryBuilder('revenue')
    .select('SUM(revenue.amount)', 'total')
    .getRawOne();

  return {
    totalAll: parseFloat(totalAll) || 0,
    revenuesByBranch,
  };
}



}