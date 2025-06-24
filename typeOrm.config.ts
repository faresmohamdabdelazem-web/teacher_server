import { config } from 'dotenv';
import { DataSource } from 'typeorm';
config({ path: '.env.prod' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT!,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity{.ts,.js}', 'src/**/*.entity{.ts,.js}'],
  migrations: ['migrations/**'],
  ssl: process.env.NODE_ENV == 'prod' ? true : false,
});
