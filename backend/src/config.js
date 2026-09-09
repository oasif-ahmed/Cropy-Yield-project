import 'dotenv/config';

export const config = {
  port: process.env.PORT || 5001,
  databaseUrl:
    process.env.DATABASE_URL || 'postgresql://127.0.0.1:5432/cropyield',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  weather: {
    url: process.env.WEATHER_API_URL || '',
    key: process.env.WEATHER_API_KEY || '',
  },
  ml: {
    url: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001',
    enabled: process.env.ML_ENABLED === 'true',
  },
};
