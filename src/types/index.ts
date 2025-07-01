import { FastifyRequest } from 'fastify';
import { Db } from 'mongodb';

export interface User {
  _id?: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role: 'user' | 'superadmin';
  profile?: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  location?: string;
  timezone?: string;
  preferences: {
    units: 'metric' | 'imperial';
    language: 'en' | 'es' | 'fr' | 'de';
    notifications: boolean;
  };
}

export interface WeatherSearch {
  _id?: string;
  userId: string;
  city: string;
  weatherData: WeatherData;
  searchedAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'superadmin';
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
    mongo: Db;
    config: {
      MONGODB_URI: string;
      MONGODB_DB_NAME: string;
      PORT: string;
      OPENWEATHER_API_KEY: string;
      OPENWEATHER_API_URL: string;
    };
  }
}
