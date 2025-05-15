import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface PostgresConfig {
  connectionString: string;
  ssl?: boolean;
  maxPoolSize?: number;
  minPoolSize?: number;
  idleTimeoutMillis?: number;
}

// Environment mapping with defaults
export const getPostgresConfig = (): PostgresConfig => {
  return {
    connectionString: process.env.DATABASE_URL || 'postgresql://terrafusionpro:terrafusiondevelopment@localhost:5432/terrafusionpro',
    ssl: process.env.DATABASE_SSL === 'true',
    maxPoolSize: Number(process.env.DATABASE_POOL_MAX) || 10,
    minPoolSize: Number(process.env.DATABASE_POOL_MIN) || 2,
    idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT) || 30000,
  };
};

// Get configuration for current environment
export const getDatabaseConfig = (): PostgresConfig => {
  const environment = process.env.NODE_ENV || 'development';
  console.log(`Loading database configuration for environment: ${environment}`);
  
  return getPostgresConfig();
};
