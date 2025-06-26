import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class StudentUserRelationRefactor1700000000002 implements MigrationInterface {
  name = 'StudentUserRelationRefactor1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old foreign key on id if exists
    const table = await queryRunner.getTable('students');
    const oldFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('id') !== -1);
    if (oldFk) {
      await queryRunner.dropForeignKey('students', oldFk);
    }

    // Add new nullable userId column
    await queryRunner.addColumn(
      'students',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add new foreign key from userId to users.id
    await queryRunner.createForeignKey(
      'students',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['userId'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new foreign key
    const table = await queryRunner.getTable('students');
    const userIdFk = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
    if (userIdFk) {
      await queryRunner.dropForeignKey('students', userIdFk);
    }
    // Drop userId column
    await queryRunner.dropColumn('students', 'userId');
    // (Optional) You may want to restore the old foreign key on id if needed
  }
} 