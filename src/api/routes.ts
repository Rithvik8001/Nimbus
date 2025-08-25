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

// Initialize services (reuse existing CLI infrastructure)
const openAIService = new OpenAIService();
const openWeatherService = new OpenWeatherService();
const geoIPService = new GeoIPService();

/**
 * POST /api/weather
 * Natural language weather query
 */
router.post(
  "/weather",
  validateRequest(WeatherQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { query, units, summary } = req.body;

      // Create a temporary CLI instance to reuse existing logic
      const weatherCLI = new WeatherCLI({
        units: units || "imperial",
        debug: false,
      });

      // Parse intent using existing AI service
      let intent;
      try {
        intent = await openAIService.parseIntent(query);
      } catch (error) {
        // Fall back to regex parser if AI fails
        intent = openAIService.parseIntentFallback(query);
      }

      // Resolve location
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

      // Fetch weather data
      const weatherData = await weatherCLI.fetchWeatherData(intent);

      // Handle both single WeatherData and array responses
      const weatherArray = Array.isArray(weatherData) ? weatherData : [weatherData];

      if (!weatherArray || weatherArray.length === 0) {
        throw new ServiceError("No weather data found", "openweather");
      }

      const currentWeather = weatherArray[0];
      
      if (!currentWeather) {
        throw new ServiceError('No weather data available', 'openweather');
      }

      // Generate summary if requested
      let aiSummary: string | undefined;
      if (summary) {
        try {
          const summaryResult = await openAIService.generateSummary(
            currentWeather,
            intent.extras || []
          );
          aiSummary = typeof summaryResult === 'string' ? summaryResult : summaryResult.briefing;
        } catch (error) {
          console.warn("Failed to generate AI summary:", error);
          // Don't fail the request if summary generation fails
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
      throw error; // Let error handler middleware handle it
    }
  }
);

/**
 * GET /api/forecast
 * Get weather forecast for a specific city
 */
router.get(
  "/forecast",
  validateRequest(LocationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { city, units, days, summary } = req.query as any;

      // Fetch current weather and forecast
      const [currentData, forecastData] = await Promise.all([
        openWeatherService.getCurrentWeather(city, units || "imperial"),
        openWeatherService.getForecast(city, days || 3, units || "imperial"),
      ]);

      // Extract forecast array and limit to requested days
      const forecastArray = forecastData.forecast || [];
      const limitedForecast = forecastArray.slice(0, days || 3);

      // Generate summary if requested
      let aiSummary: string | undefined;
      if (summary) {
        try {
          const summaryResult = await openAIService.generateSummary(currentData, [
            "forecast",
          ]);
          aiSummary = typeof summaryResult === 'string' ? summaryResult : summaryResult.briefing;
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
          days: days || 3,
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

/**
 * POST /api/compare
 * Compare weather across multiple cities
 */
router.post(
  "/compare",
  validateRequest(CompareQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { cities, units, summary } = req.body;

      // Fetch weather for all cities in parallel
      const weatherPromises = cities.map((city: string) =>
        openWeatherService
          .getCurrentWeather(city, units || "imperial")
          .catch((error) => {
            console.error(`Failed to fetch weather for ${city}:`, error);
            return null; // Return null for failed cities
          })
      );

      const weatherResults = await Promise.all(weatherPromises);

      // Filter out failed requests
      const validWeatherData = weatherResults.filter((data) => data !== null);

      if (validWeatherData.length === 0) {
        throw new ServiceError(
          "Failed to fetch weather data for any city",
          "openweather"
        );
      }

      // Generate comparison summary if requested
      let aiSummary: string | undefined;
      if (summary && validWeatherData.length > 0) {
        try {
          const summaryResult = await openAIService.generateSummary(validWeatherData[0], [
            "compare",
          ]);
          aiSummary = typeof summaryResult === 'string' ? summaryResult : summaryResult.briefing;
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

/**
 * GET /api/location
 * Get current location based on IP
 */
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
