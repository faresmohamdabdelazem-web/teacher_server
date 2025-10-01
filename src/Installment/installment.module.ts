import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installment } from './entities/installment.entity';
import { Student } from 'src/user/student/student.entity';
import { InstallmentService } from './installment.service';
import { InstallmentController } from './installment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Installment, Student])],
  providers: [InstallmentService],
  controllers: [InstallmentController],
  exports: [InstallmentService], // مهم جداً
})
export class InstallmentModule {}
