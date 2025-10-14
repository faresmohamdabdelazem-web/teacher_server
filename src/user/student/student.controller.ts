import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './create-student.dto';
import { WhatsAppService } from '../../notification/whatsapp.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UserRole } from '../user.role.enum';

import { GetSignedUser } from 'src/decorators/get.signed.user.decorator';
import { PayInstallmentDto } from 'src/Installment/dto/pay-installment.dto';

@Controller('students')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  @Post()
    @UseGuards(AuthGuard, RoleGuard)
     @Roles(UserRole.ADMIN,UserRole.ASSISTANT)
  create(@Body() createStudentDto: CreateStudentDto,
@GetSignedUser() user: any,
) {
    return this.studentService.create(createStudentDto,user);
  }

  @Post(':id/pay')

  payInstallment(
    @Param('id') id: string,
    @Body() payInstallmentDto: PayInstallmentDto,
  ) {
    return this.studentService.payInstallment(id, payInstallmentDto);
  }

 @Get()
   @UseGuards(AuthGuard, RoleGuard)
     @Roles(UserRole.ADMIN,UserRole.ASSISTANT)
findAll(
   @GetSignedUser() user: any,
  @Query('branchId') branchId?: string,
  @Query('sectionId') sectionId?: string,
  @Query('isLate') isLate?: string,

) {
  return this.studentService.findAll(branchId, sectionId, isLate,user);
}
  

@Get('name')
@UseGuards(AuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.ASSISTANT)
findAllName(@GetSignedUser() user: any) {
  return this.studentService.findAllName(user);
}




  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  @Get('phoneNumber/:phoneNumber')
  findByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    return this.studentService.findByPhoneNumber(phoneNumber);
  }

  @Get('manualEntryId/:manualEntryId')
  findByManualEntryId(@Param('manualEntryId') manualEntryId: string) {
    return this.studentService.findByManualEntryId(manualEntryId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStudentDto: Partial<CreateStudentDto>,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Get(':id/teachers')
  getStudentTeachers(@Param('id') id: string) {
    return this.studentService.getStudentTeachers(id);
  }

  @Get(':id/lessons')
  getStudentLessons(@Param('id') id: string) {
    return this.studentService.getStudentLessons(id);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.TEACHER, UserRole.ASSISTANT)
  @Post('send-barcode')
  async sendBarcodeToPhone(
    @Body() body: { phoneNumber: string; base64Image: string },
  ) {
    const { phoneNumber, base64Image } = body;
    const to = phoneNumber.startsWith('+') ? phoneNumber : `+2${phoneNumber}`;
    const result = await this.whatsAppService.sendImageBarcode(
      to,
      base64Image,
    );
    return { success: result, message: 'Barcode sent successfully' };
  }
}