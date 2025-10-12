import { config } from 'dotenv';
config();

export const DB_USER = process.env.DB_USER;
export const DB_HOST = process.env.DB_HOST;
export const DB_DATABASE = process.env.DB_DATABASE;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_PORT = parseInt(process.env.DB_PORT, 10);

// variables for server
export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || 'localhost';

export const SALT_ROUNDS = 10
export const JWT_SECRET = process.env.JWT_SECRET
