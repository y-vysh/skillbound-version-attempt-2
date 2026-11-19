import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: Number(process.env.PORT || 3000),
  JWT_SECRET: process.env.JWT_SECRET || 'skillbound_dev_jwt_secret_change_in_production',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'data', 'skillbound.db'),
  UPLOAD_DIR: path.resolve(process.cwd(), 'uploads'),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
