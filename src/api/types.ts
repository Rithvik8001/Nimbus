import { z } from 'zod';
import { WeatherData } from '../types/index.js';

// API Request schemas
export const WeatherQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  units: z.enum(['metric', 'imperial']).optional().default('imperial'),
  summary: z.boolean().optional().default(false),
});

export const LocationQuerySchema = z.object({
  city: z.string().min(1, 'City is required'),
  units: z.enum(['metric', 'imperial']).optional().default('imperial'),
  days: z.number().min(1).max(10).optional().default(3),
  summary: z.boolean().optional().default(false),
});

export const CompareQuerySchema = z.object({
  cities: z.array(z.string().min(1)).min(2, 'At least 2 cities required for comparison'),
  units: z.enum(['metric', 'imperial']).optional().default('imperial'),
  summary: z.boolean().optional().default(false),
});

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface WeatherApiResponse extends ApiResponse {
  data: {
    weather: WeatherData;
    summary?: string;
    query: string;
    location: string;
  };
}

export interface ForecastApiResponse extends ApiResponse {
  data: {
    current: WeatherData;
    forecast: Array<{
      date: Date;
      temperature: {
        min: number;
        max: number;
      };
      description: string;
      icon: string;
      main: string;
      humidity: number;
      windSpeed: number;
      precipitationProbability: number;
    }>;
    summary?: string;
    city: string;
    days: number;
  };
}

export interface ComparisonApiResponse extends ApiResponse {
  data: {
    cities: WeatherData[];
    summary?: string;
    comparedCities: string[];
  };
}

export interface HealthResponse extends ApiResponse {
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    services: {
      openai: 'connected' | 'error';
      openweather: 'connected' | 'error';
    };
  };
}

// Validation middleware types
export type WeatherQuery = z.infer<typeof WeatherQuerySchema>;
export type LocationQuery = z.infer<typeof LocationQuerySchema>;
export type CompareQuery = z.infer<typeof CompareQuerySchema>;

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
