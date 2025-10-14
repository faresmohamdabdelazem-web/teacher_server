import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { Revenue } from './entities/revenues.entity';

@Controller('revenues') // يعني أن كل الـ routes هنا ستبدأ بـ /revenues
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) { }


 @Get('summary')
  getRevenueSummary(
    @Query('branchId') branchId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.revenueService.getRevenueSummary(branchId,sectionId);
  }


}