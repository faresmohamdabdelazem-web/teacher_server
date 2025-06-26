import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class StudentNoUserRefactor1700000000003 implements MigrationInterface {
  name = 'StudentNoUserRefactor1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop userId column and its foreign key if exists
    const table = await queryRunner.getTable('students');
    const userIdFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
    if (userIdFk) {
      await queryRunner.dropForeignKey('students', userIdFk);
    }
    const userIdCol = table.findColumnByName('userId');
    if (userIdCol) {
      await queryRunner.dropColumn('students', 'userId');
    }

    // Add firstName, lastName, phoneNumber columns
    await queryRunner.addColumns('students', [
      new TableColumn({
        name: 'firstName',
        type: 'varchar',
        isNullable: false,
        default: "''"
      }),
      new TableColumn({
        name: 'lastName',
        type: 'varchar',
        isNullable: false,
        default: "''"
      }),
      new TableColumn({
        name: 'phoneNumber',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove firstName, lastName, phoneNumber columns
    await queryRunner.dropColumn('students', 'firstName');
    await queryRunner.dropColumn('students', 'lastName');
    await queryRunner.dropColumn('students', 'phoneNumber');
    // Add userId column back (nullable)
    await queryRunner.addColumn('students', new TableColumn({
      name: 'userId',
      type: 'uuid',
      isNullable: true,
    }));
    // (Optional) You may want to restore the foreign key as well
  }
} 