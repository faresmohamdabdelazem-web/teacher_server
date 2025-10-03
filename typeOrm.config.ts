import { config } from 'dotenv';
import { DataSource } from 'typeorm';
config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity{.ts,.js}', 'src/**/*.entity{.ts,.js}'],
  migrations: ['migrations/**'],
  ssl: true,
  extra: {
    ssl: { rejectUnauthorized: false },
  },
});
