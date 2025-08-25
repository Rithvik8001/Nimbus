import { z } from 'zod';

/**
 * Weather intent schema for parsing natural language queries
 */
export const WeatherIntentSchema = z.object({
  cities: z.array(z.string()).min(1, 'At least one city is required'),
  date: z.object({
    kind: z.enum(['today', 'tomorrow', 'range']),
    days: z.number().optional(),
    weekend: z.boolean().optional(),
  }),
  units: z.enum(['metric', 'imperial']).default('metric'),
  extras: z.array(z.string()).optional(),
  useIpLocation: z.boolean().default(false),
  compare: z.boolean().default(false),
});

export type WeatherIntent = z.infer<typeof WeatherIntentSchema>;

/**
 * OpenWeather API response types
 */
export interface OpenWeatherCurrent {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface OpenWeatherForecast {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level: number;
      grnd_level: number;
      humidity: number;
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust: number;
    };
    visibility: number;
    pop: number;
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    sys: {
      pod: string;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

/**
 * Normalized weather data for internal use
 */
export interface WeatherData {
  city: string;
  country: string;
  current?: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    pressure: number;
    visibility: number;
    windSpeed: number;
    windDirection: number;
    description: string;
    icon: string;
    main: string;
    timestamp: Date;
  };
  forecast?: Array<{
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
}

/**
 * Geo-location data from IP
 */
export interface GeoLocation {
  city: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  timezone: string;
}

/**
 * CLI configuration
 */
export interface Config {
  openaiApiKey: string;
  openweatherApiKey: string;
  debug: boolean;
  timeout: number;
  retries: number;
}

/**
 * Weather summary from AI
 */
export interface WeatherSummary {
  briefing: string;
  tips: string[];
}

/**
 * CLI command options
 */
export interface CliOptions {
  debug?: boolean;
  units?: 'metric' | 'imperial';
  format?: 'detailed' | 'simple';
}
