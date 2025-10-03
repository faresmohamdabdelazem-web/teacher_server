import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @Get()
  findAll() {
    return this.branchService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchService.remove(id);
  }

  // --- بداية الإضافة: Endpoint لربط قسم بفرع ---
  @Post(':branchId/sections/:sectionId')
  addSectionToBranch(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ) {
    return this.branchService.addSectionToBranch(branchId, sectionId);
  }
  // --- نهاية الإضافة ---

  // --- بداية الإضافة: Endpoint لإزالة ربط قسم بفرع ---
  @Delete(':branchId/sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSectionFromBranch(
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ) {
    return this.branchService.removeSectionFromBranch(branchId, sectionId);
  }
  // --- نهاية الإضافة ---
}