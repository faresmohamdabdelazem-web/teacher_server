const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function pushSchema() {
  try {
    console.log('Starting application to push schema...');
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn'],
    });
    
    console.log('Schema synchronization completed!');
    console.log('All database tables have been created/updated.');
    
    await app.close();
    console.log('Application closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
}

pushSchema();
