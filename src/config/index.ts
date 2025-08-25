import { z } from "zod";
import dotenv from "dotenv";
import { Config } from "../types/index.js";

dotenv.config();

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENWEATHER_API_KEY: z.string().min(1, "OPENWEATHER_API_KEY is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export class AppConfig {
  private static instance: AppConfig;
  private config: Config;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  private loadConfig(): Config {
    try {
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

  public getConfig(): Config {
    return { ...this.config };
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  public isDebug(): boolean {
    return this.config.debug;
  }

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

export const getConfig = (): AppConfig => AppConfig.getInstance();
