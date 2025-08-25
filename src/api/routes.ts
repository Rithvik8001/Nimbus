import { Router, Request, Response } from "express";
import { validateRequest } from "./middleware.js";
import {
  WeatherQuerySchema,
  LocationQuerySchema,
  CompareQuerySchema,
  WeatherApiResponse,
  ForecastApiResponse,
  ComparisonApiResponse,
  ServiceError,
} from "./types.js";
import { WeatherCLI } from "../cli/weather-cli.js";
import { OpenAIService } from "../services/openai.service.js";
import { OpenWeatherService } from "../services/openweather.service.js";
import { GeoIPService } from "../services/geoip.service.js";

const router = Router();

const openAIService = new OpenAIService();
const openWeatherService = new OpenWeatherService();
const geoIPService = new GeoIPService();

router.post(
  "/weather",
  validateRequest(WeatherQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { query, units, summary } = req.body;

      const weatherCLI = new WeatherCLI({
        units: units || "imperial",
        debug: false,
      });

      let intent;
      try {
        intent = await openAIService.parseIntent(query);
      } catch (error) {
        intent = openAIService.parseIntentFallback(query);
      }

      let location = intent.cities?.[0] || "unknown";
      if (intent.useIpLocation) {
        try {
          const geoData = await geoIPService.getCurrentLocation();
          location = geoData.city;
        } catch (error) {
          throw new ServiceError(
            "Failed to resolve IP location",
            "geoip",
            error
          );
        }
      }

      const weatherData = await weatherCLI.fetchWeatherData(intent);

      const weatherArray = Array.isArray(weatherData)
        ? weatherData
        : [weatherData];

      if (!weatherArray || weatherArray.length === 0) {
        throw new ServiceError("No weather data found", "openweather");
      }

      const currentWeather = weatherArray[0];

      if (!currentWeather) {
        throw new ServiceError("No weather data available", "openweather");
      }

      let aiSummary: string | undefined;
      if (summary) {
        try {
          const summaryResult = await openAIService.generateSummary(
            currentWeather,
            intent.extras || []
          );
          aiSummary =
            typeof summaryResult === "string"
              ? summaryResult
              : summaryResult.briefing;
        } catch (error) {
          console.warn("Failed to generate AI summary:", error);
        }
      }

      const response: WeatherApiResponse = {
        success: true,
        data: {
          weather: currentWeather,
          ...(aiSummary && { summary: aiSummary }),
          query,
          location,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error("Weather API error:", error);
      throw error;
    }
  }
);

router.get(
  "/forecast",
  validateRequest(LocationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { city, units, days, summary } = req.query as any;

      const forecastDays = days || 3;
      const weatherUnits = units || "imperial";

      const [currentData, forecastData] = await Promise.all([
        openWeatherService.getCurrentWeather(city, weatherUnits),
        openWeatherService.getForecast(city, forecastDays, weatherUnits),
      ]);

      const forecastArray = forecastData.forecast || [];
      const limitedForecast = forecastArray.slice(0, forecastDays);

      let aiSummary: string | undefined;
      if (summary) {
        try {
          const summaryResult = await openAIService.generateSummary(
            currentData,
            ["forecast"]
          );
          aiSummary =
            typeof summaryResult === "string"
              ? summaryResult
              : summaryResult.briefing;
        } catch (error) {
          console.warn("Failed to generate forecast summary:", error);
        }
      }

      const response: ForecastApiResponse = {
        success: true,
        data: {
          current: currentData,
          forecast: limitedForecast,
          ...(aiSummary && { summary: aiSummary }),
          city,
          days: forecastDays,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error("Forecast API error:", error);
      throw error;
    }
  }
);

router.post(
  "/compare",
  validateRequest(CompareQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { cities, units, summary } = req.body;

      const weatherPromises = cities.map((city: string) =>
        openWeatherService
          .getCurrentWeather(city, units || "imperial")
          .catch((error) => {
            console.error(`Failed to fetch weather for ${city}:`, error);
            return null;
          })
      );

      const weatherResults = await Promise.all(weatherPromises);

      const validWeatherData = weatherResults.filter((data) => data !== null);

      if (validWeatherData.length === 0) {
        throw new ServiceError(
          "Failed to fetch weather data for any city",
          "openweather"
        );
      }

      let aiSummary: string | undefined;
      if (summary && validWeatherData.length > 0) {
        try {
          const summaryResult = await openAIService.generateSummary(
            validWeatherData[0],
            ["compare"]
          );
          aiSummary =
            typeof summaryResult === "string"
              ? summaryResult
              : summaryResult.briefing;
        } catch (error) {
          console.warn("Failed to generate comparison summary:", error);
        }
      }

      const response: ComparisonApiResponse = {
        success: true,
        data: {
          cities: validWeatherData,
          ...(aiSummary && { summary: aiSummary }),
          comparedCities: cities,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error("Compare API error:", error);
      throw error;
    }
  }
);

router.get("/location", async (_req: Request, res: Response) => {
  try {
    const geoData = await geoIPService.getCurrentLocation();

    res.json({
      success: true,
      data: geoData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Location API error:", error);
    throw new ServiceError("Failed to determine location", "geoip", error);
  }
});

export { router as weatherRoutes };
