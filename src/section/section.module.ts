import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from './entities/section.entity';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { Branch } from 'src/branch/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Section,Branch])],
  controllers: [SectionController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}