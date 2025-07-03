import { Controller, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../decorators/role.decorator';
import { UserRole } from '../user/user.role.enum';

@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
export class AdminController {
  constructor(private readonly dataSource: DataSource) {}

  @Post('reset-database')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async resetDatabase() {
    if (process.env.NODE_ENV !== 'dev') {
      return { message: 'Database reset is only allowed in development mode.' };
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.startTransaction();
      // Disable foreign key checks
      await queryRunner.query('SET session_replication_role = replica;');
      // Get all table names
      const tables = await queryRunner.getTables();
      for (const table of tables) {
        await queryRunner.query(`TRUNCATE TABLE "${table.name}" RESTART IDENTITY CASCADE;`);
      }
      // Enable foreign key checks
      await queryRunner.query('SET session_replication_role = DEFAULT;');
      await queryRunner.commitTransaction();
      return { message: 'Database reset successfully.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
} 