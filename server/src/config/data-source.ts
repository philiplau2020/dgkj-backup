import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'dgkj',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    __dirname + '/../database/entities/**/*.ts',
    __dirname + '/../modules/open/entity/**/*.ts',
  ],
  migrations: [__dirname + '/../database/migrations/**/*.ts'],
  subscribers: [],
});
