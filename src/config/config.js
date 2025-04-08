import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific .env file
const environment = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${environment}`)
});

const config = {
  env: environment,
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  
  // Add other configuration variables
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  
  // API versioning - set to empty string to disable
  apiVersion: '',
  
  // Logging configuration
  logging: {
    level: environment === 'development' ? 'debug' : 'info',
    // Add other logging configs
  },
  
  // CORS configuration
  cors: {
    origin: environment === 'development' 
      ? ['http://localhost:4200'] 
      : ['https://grain-management-frontend.vercel.app', 'http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
};

// Add validation to ensure required environment variables are set
const requiredEnvVars = ['MONGODB_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is required but not set.`);
  }
}

export default config; 