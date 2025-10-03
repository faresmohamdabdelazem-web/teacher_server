import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { Section } from 'src/section/entities/section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Branch,Section])],
  controllers: [BranchController],
  providers: [BranchService],
  exports: [BranchService], 
})
export class BranchModule {}