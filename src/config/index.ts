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

        // Provide user-friendly setup instructions
        const setupInstructions = `
❌ Missing API Keys

To use Nimbus Weather CLI, you need to set up your API keys:

1. Get your API keys:
   • OpenAI API Key: https://platform.openai.com/api-keys
   • OpenWeather API Key: https://openweathermap.org/api

2. Create a .env file in your home directory:
   echo "OPENAI_API_KEY=your_openai_key_here" > ~/.env
   echo "OPENWEATHER_API_KEY=your_openweather_key_here" >> ~/.env

3. Try again: nimbus weather "what's the weather in Miami?"

Missing variables: ${missingVars}
        `.trim();

        throw new Error(setupInstructions);
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
