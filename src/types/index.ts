import { FastifyRequest } from 'fastify';
import { Connection } from 'mongoose';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  preferences: {
    temperatureUnit: 'celsius' | 'fahrenheit';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface WeatherRequest {
  city: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}

declare module 'fastify' {
  interface FastifyInstance {
    mongo: Connection;
    config: {
      MONGODB_URI: string;
      MONGODB_DB_NAME: string;
      PORT: string;
      OPENWEATHER_API_KEY: string;
      OPENWEATHER_API_URL: string;
      JWT_SECRET: string;
    };
  }
}
