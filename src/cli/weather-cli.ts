import chalk from "chalk";
import ora from "ora";
import {
  WeatherIntent,
  WeatherData,
  WeatherSummary,
  CliOptions,
} from "../types/index.js";
import { openAIService } from "../services/openai.service.js";
import { openWeatherService } from "../services/openweather.service.js";
import { geoIPService } from "../services/geoip.service.js";
import { WeatherRenderer } from "./weather-renderer.js";

export class WeatherCLI {
  private options: CliOptions;
  private renderer: WeatherRenderer;

  constructor(options: CliOptions) {
    this.options = {
      debug: false,
      units: "imperial",
      format: "detailed",
      ...options,
    };

    this.renderer = new WeatherRenderer(this.options);
  }

  async processQuery(query: string): Promise<void> {
    const spinner = ora("Thinking...").start();

    try {
      spinner.text = "Parsing your request...";
      const intent = await this.parseIntent(query);

      spinner.text = "Resolving location...";
      const resolvedIntent = await this.resolveLocation(intent);

      spinner.text = "Fetching weather data...";
      const weatherData = await this.fetchWeatherData(resolvedIntent);

      spinner.text = "Generating summary...";
      const summary = await this.generateSummary(
        weatherData,
        resolvedIntent.extras
      );

      spinner.stop();
      this.renderer.renderWeather(weatherData, summary, resolvedIntent);
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async parseIntent(query: string): Promise<WeatherIntent> {
    try {
      return await openAIService.parseIntent(query);
    } catch (error) {
      if (this.options.debug) {
        console.log(
          chalk.yellow("⚠️  AI parsing failed, using fallback parser")
        );
      }
      return openAIService.parseIntentFallback(query);
    }
  }

  private async resolveLocation(intent: WeatherIntent): Promise<WeatherIntent> {
    if (!intent.useIpLocation) {
      return intent;
    }

    try {
      const location = await geoIPService.getCurrentLocation();
      const resolvedIntent = { ...intent };

      if (intent.cities.includes("Unknown")) {
        resolvedIntent.cities = [location.city];
      }

      return resolvedIntent;
    } catch (error) {
      throw new Error(
        `Failed to resolve your location: ${(error as Error).message}`
      );
    }
  }

  private async fetchWeatherData(
    intent: WeatherIntent
  ): Promise<WeatherData | WeatherData[]> {
    const { cities, date } = intent;
    const units = intent.units || this.options.units;

    if (intent.compare && cities.length >= 2) {
      const weatherPromises = cities.map((city) =>
        this.fetchWeatherForCity(city, date, units)
      );
      return Promise.all(weatherPromises);
    }

    const city = cities[0];
    if (!city) {
      throw new Error("No city specified in the query");
    }

    return this.fetchWeatherForCity(city, date, units);
  }

  private async fetchWeatherForCity(
    city: string,
    date: WeatherIntent["date"],
    units: "metric" | "imperial"
  ): Promise<WeatherData> {
    const days = this.calculateDays(date);

    if (days === 1 && date.kind === "today") {
      return openWeatherService.getCurrentWeather(city, units);
    } else if (days === 1 && date.kind === "tomorrow") {
      const forecastData = await openWeatherService.getForecast(city, 2, units);
      if (forecastData.forecast && forecastData.forecast.length > 1) {
        const tomorrowForecast = forecastData.forecast[1];
        if (tomorrowForecast) {
          return {
            city: forecastData.city,
            country: forecastData.country,
            forecast: [tomorrowForecast],
          };
        }
      }
      return forecastData;
    } else {
      return openWeatherService.getForecast(city, days, units);
    }
  }

  private calculateDays(date: WeatherIntent["date"]): number {
    switch (date.kind) {
      case "today":
        return 1;
      case "tomorrow":
        return 1;
      case "range":
        if (date.weekend) {
          return 2;
        }
        return date.days || 3;
      default:
        return 3;
    }
  }

  private async generateSummary(
    weatherData: WeatherData | WeatherData[],
    extras?: string[]
  ): Promise<WeatherSummary | null> {
    try {
      if (Array.isArray(weatherData)) {
        const firstCity = weatherData[0];
        if (firstCity) {
          return await openAIService.generateSummary(firstCity, extras);
        }
        return null;
      } else {
        return await openAIService.generateSummary(weatherData, extras);
      }
    } catch (error) {
      if (this.options.debug) {
        console.log(chalk.yellow("⚠️  Failed to generate AI summary"));
      }
      return null;
    }
  }

  getDebugInfo(): object {
    return {
      options: this.options,
      timestamp: new Date().toISOString(),
    };
  }
}
