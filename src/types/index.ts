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
  country?: string;
  lat?: number;
  lon?: number;
  // Enhanced weather data
  visibility?: number;
  pressure?: number;
  sunrise?: number;
  sunset?: number;
  feelsLike?: number;
  // Air quality data
  airQuality?: {
    aqi: number;
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
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
  city?: string;
  lat?: number;
  lon?: number;
}

export interface LocationRequest {
  q?: string;
  lat?: number;
  lon?: number;
  limit?: number;
}

export interface FavoriteLocation {
  id: string;
  userId: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}

export interface AirQuality {
  aqi: number;
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  nh3: number;
  description?: string;
  recommendations?: string[];
}

export interface HourlyWeather {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  pop: number; // Probability of precipitation
}

export interface EnhancedWeatherData extends WeatherData {
  // UV Index data
  uvi?: number;
  uvDescription?: string;
  uvRecommendations?: string[];

  // Enhanced forecast data
  hourlyForecast?: HourlyWeather[];
  minutelyForecast?: Array<{
    dt: number;
    precipitation: number;
  }>;

  // Astronomical data
  moonPhase?: number;
  moonPhaseDescription?: string;
  moonrise?: number;
  moonset?: number;

  // Weather alerts
  alerts?: Array<{
    sender_name: string;
    event: string;
    start: number;
    end: number;
    description: string;
    tags: string[];
  }>;
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
