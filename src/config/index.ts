import { z } from "zod";
import dotenv from "dotenv";
import { Config } from "../types/index.js";

// Load environment variables
dotenv.config();

/**
 * Environment variables schema for validation
 */
const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENWEATHER_API_KEY: z.string().min(1, "OPENWEATHER_API_KEY is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Configuration class for managing app settings
 */
export class AppConfig {
  private static instance: AppConfig;
  private config: Config;

  private constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Get singleton instance of AppConfig
   */
  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  /**
   * Load and validate configuration from environment variables
   */
  private loadConfig(): Config {
    try {
      // Validate environment variables
      const env = EnvSchema.parse(process.env);

      return {
        openaiApiKey: env.OPENAI_API_KEY,
        openweatherApiKey: env.OPENWEATHER_API_KEY,
        debug: env.NODE_ENV === "development",
        timeout: 10000, // 10 seconds
        retries: 3,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.errors
          .map((err) => err.path.join("."))
          .join(", ");
        throw new Error(
          `Missing or invalid environment variables: ${missingVars}`
        );
      }
      throw error;
    }
  }

  /**
   * Get the current configuration
   */
  public getConfig(): Config {
    return { ...this.config };
  }

  /**
   * Get a specific configuration value
   */
  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  /**
   * Check if debug mode is enabled
   */
  public isDebug(): boolean {
    return this.config.debug;
  }

  /**
   * Validate that all required API keys are present
   */
  public validateApiKeys(): void {
    if (!this.config.openaiApiKey) {
      throw new Error(
        "OPENAI_API_KEY is required. Please set it in your .env file."
      );
    }
    if (!this.config.openweatherApiKey) {
      throw new Error(
        "OPENWEATHER_API_KEY is required. Please set it in your .env file."
      );
    }
  }
}

/**
 * Export a convenience function to get the config instance
 */
export const getConfig = (): AppConfig => AppConfig.getInstance();
