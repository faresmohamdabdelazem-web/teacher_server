import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddTeacherToAssistant1700000000001 implements MigrationInterface {
  name = 'AddTeacherToAssistant1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add teacherId column to assistants table
    await queryRunner.addColumn(
      'assistants',
      new TableColumn({
        name: 'teacherId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'assistants',
      new TableForeignKey({
        columnNames: ['teacherId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teachers',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    const table = await queryRunner.getTable('assistants');
    const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('teacherId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('assistants', foreignKey);
    }

    // Drop teacherId column
    await queryRunner.dropColumn('assistants', 'teacherId');
  }
} 