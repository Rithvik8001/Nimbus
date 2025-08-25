import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  OpenWeatherCurrent,
  OpenWeatherForecast,
  WeatherData,
} from "../types/index.js";
import { getConfig } from "../config/index.js";
import { retry } from "../utils/index.js";

/**
 * OpenWeather API service for fetching weather data
 */
export class OpenWeatherService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    const config = getConfig();
    this.apiKey = config.get("openweatherApiKey");

    this.client = axios.create({
      baseURL: "https://api.openweathermap.org/data/2.5",
      timeout: config.get("timeout"),
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for API key
    this.client.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        appid: this.apiKey,
      };
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error(
            "Invalid OpenWeather API key. Please check your OPENWEATHER_API_KEY environment variable."
          );
        }
        if (error.response?.status === 404) {
          throw new Error(
            "City not found. Please check the city name and try again."
          );
        }
        if (error.response?.status === 429) {
          throw new Error(
            "OpenWeather API rate limit exceeded. Please try again later."
          );
        }
        if (error.code === "ECONNABORTED") {
          throw new Error(
            "Request timeout. Please check your internet connection and try again."
          );
        }
        throw new Error(`OpenWeather API error: ${error.message}`);
      }
    );
  }

  /**
   * Get current weather for a city
   */
  async getCurrentWeather(
    city: string,
    units: "metric" | "imperial" = "metric"
  ): Promise<WeatherData> {
    try {
      const response = await retry(
        () =>
          this.client.get<OpenWeatherCurrent>("/weather", {
            params: {
              q: city,
              units,
            },
          }),
        getConfig().get("retries")
      );

      return this.transformCurrentWeather(response.data);
    } catch (error) {
      throw new Error(
        `Failed to fetch current weather for ${city}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get weather forecast for a city
   */
  async getForecast(
    city: string,
    days: number = 5,
    units: "metric" | "imperial" = "metric"
  ): Promise<WeatherData> {
    try {
      const response = await retry(
        () =>
          this.client.get<OpenWeatherForecast>("/forecast", {
            params: {
              q: city,
              units,
              cnt: Math.min(days * 8, 40), // OpenWeather provides 3-hour intervals, max 40 entries
            },
          }),
        getConfig().get("retries")
      );

      return this.transformForecast(response.data, days);
    } catch (error) {
      throw new Error(
        `Failed to fetch forecast for ${city}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get both current weather and forecast for a city
   */
  async getWeatherAndForecast(
    city: string,
    days: number = 5,
    units: "metric" | "imperial" = "metric"
  ): Promise<WeatherData> {
    try {
      const [currentData, forecastData] = await Promise.all([
        this.getCurrentWeather(city, units),
        this.getForecast(city, days, units),
      ]);

      return {
        ...currentData,
        forecast: forecastData.forecast || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch weather data for ${city}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Transform OpenWeather current weather response to internal format
   */
  private transformCurrentWeather(data: OpenWeatherCurrent): WeatherData {
    const weather = data.weather[0];

    if (!weather) {
      throw new Error("No weather data available");
    }

    return {
      city: data.name,
      country: data.sys.country,
      current: {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        description: weather.description,
        icon: weather.icon,
        main: weather.main,
        timestamp: new Date(data.dt * 1000),
      },
    };
  }

  /**
   * Transform OpenWeather forecast response to internal format
   */
  private transformForecast(
    data: OpenWeatherForecast,
    days: number
  ): WeatherData {
    const forecast: WeatherData["forecast"] = [];
    const groupedByDay = new Map<string, typeof data.list>();

    // Group forecast entries by day
    data.list.forEach((entry) => {
      const date = new Date(entry.dt * 1000);
      const dayKey = date.toISOString().split("T")[0];

      if (dayKey && !groupedByDay.has(dayKey)) {
        groupedByDay.set(dayKey, []);
      }
      if (dayKey) {
        const existing = groupedByDay.get(dayKey);
        if (existing) {
          existing.push(entry);
        }
      }
    });

    // Process each day's data
    const sortedDays = Array.from(groupedByDay.keys()).sort().slice(0, days);

    sortedDays.forEach((dayKey) => {
      const dayEntries = groupedByDay.get(dayKey)!;
      const date = new Date(dayKey);

      // Calculate daily averages and extremes
      const temperatures = dayEntries.map((entry) => entry.main.temp);
      const humidities = dayEntries.map((entry) => entry.main.humidity);
      const windSpeeds = dayEntries.map((entry) => entry.wind.speed);
      const precipitationProbs = dayEntries.map((entry) => entry.pop);

      // Get the most common weather condition for the day
      const weatherCounts = new Map<string, number>();
      dayEntries.forEach((entry) => {
        const weather = entry.weather[0];
        if (weather) {
          const key = `${weather.main}-${weather.description}`;
          weatherCounts.set(key, (weatherCounts.get(key) || 0) + 1);
        }
      });

      const weatherEntries = Array.from(weatherCounts.entries());
      if (weatherEntries.length === 0) {
        // Fallback if no weather data
        forecast.push({
          date,
          temperature: {
            min: Math.min(...temperatures),
            max: Math.max(...temperatures),
          },
          description: "Unknown",
          icon: "01d",
          main: "Clear",
          humidity: Math.round(
            humidities.reduce((a, b) => a + b, 0) / humidities.length
          ),
          windSpeed:
            Math.round(
              (windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) * 10
            ) / 10,
          precipitationProbability: Math.round(
            Math.max(...precipitationProbs) * 100
          ),
        });
        return;
      }

      const sortedEntries = weatherEntries.sort(([, a], [, b]) => b - a);
      const mostCommonWeather = sortedEntries[0]?.[0] || "Clear-Unknown";
      const [main, description] = mostCommonWeather.split("-");

      // Find the corresponding weather entry for icon
      const weatherEntry = dayEntries.find((entry) => {
        const weather = entry.weather[0];
        return (
          weather &&
          weather.main === main &&
          weather.description === description
        );
      });

      forecast.push({
        date,
        temperature: {
          min: Math.min(...temperatures),
          max: Math.max(...temperatures),
        },
        description: description || "Unknown",
        icon: weatherEntry?.weather[0]?.icon || "01d",
        main: main || "Clear",
        humidity: Math.round(
          humidities.reduce((a, b) => a + b, 0) / humidities.length
        ),
        windSpeed:
          Math.round(
            (windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) * 10
          ) / 10,
        precipitationProbability: Math.round(
          Math.max(...precipitationProbs) * 100
        ),
      });
    });

    return {
      city: data.city.name,
      country: data.city.country,
      forecast: forecast || [],
    };
  }
}

/**
 * Export singleton instance
 */
export const openWeatherService = new OpenWeatherService();
