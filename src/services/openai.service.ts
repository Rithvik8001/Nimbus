import OpenAI from "openai";
import { z } from "zod";
import {
  WeatherIntent,
  WeatherIntentSchema,
  WeatherData,
  WeatherSummary,
} from "../types/index.js";
import { getConfig } from "../config/index.js";
import { retry } from "../utils/index.js";

export class OpenAIService {
  private client: OpenAI;
  private apiKey: string;

  constructor() {
    const config = getConfig();
    this.apiKey = config.get("openaiApiKey");

    this.client = new OpenAI({
      apiKey: this.apiKey,
      timeout: config.get("timeout"),
    });
  }

  async parseIntent(query: string): Promise<WeatherIntent> {
    const systemPrompt = `You are a weather intent parser for a CLI.
Input: a free-form user question.
Output: strict JSON matching the schema below. No prose, no comments.
Extract intent, cities, date/range, units, and extras. Normalize dates to { kind: "today" | "tomorrow" | "range", days?: number, weekend?: boolean }.
If city missing and user implies "here", set useIpLocation: true.
If forecasting without days, default to 3.
If units unspecified, default to "imperial".
If compare is requested, require cities.length >= 2.
Use minimal tokens; be deterministic.

Schema:
{
  "cities": ["string"],
  "date": {
    "kind": "today" | "tomorrow" | "range",
    "days": number (optional),
    "weekend": boolean (optional)
  },
  "units": "metric" | "imperial",
  "extras": ["string"] (optional),
  "useIpLocation": boolean,
  "compare": boolean
}`;

    try {
      const response = await retry(async () => {
        const completion = await this.client.chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          temperature: 0.1,
          max_tokens: 200,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from OpenAI");
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Invalid JSON response from OpenAI");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }, getConfig().get("retries"));

      const validatedIntent = WeatherIntentSchema.parse(response);
      return validatedIntent;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid intent structure: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw new Error(`Failed to parse intent: ${(error as Error).message}`);
    }
  }

  async generateSummary(
    weatherData: WeatherData,
    extras: string[] = []
  ): Promise<WeatherSummary> {
    const systemPrompt = `You are a concise weather summarizer for a terminal app.
Input: normalized weather/forecast JSON (city, dates, conditions, temps, precipitation probability, wind, UV if available) + user extras.
Output: a short, friendly briefing (max ~6 lines) with emojis: ☀️ 🌧️ ⛅ ❄️ ⚡ 🌬️ 💧 🌡️ ☂️ 😎.
Include 1-2 smart tips when extras suggests (umbrella/clothing/activity/UV/wind).
Prefer crisp phrasing; no redundant sentences.
No markdown code fences.

Return JSON:
{
  "briefing": "string",
  "tips": ["string"]
}`;

    try {
      const weatherJson = JSON.stringify(weatherData, null, 2);
      const extrasText =
        extras.length > 0 ? `\nUser extras: ${extras.join(", ")}` : "";

      const response = await retry(async () => {
        const completion = await this.client.chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Weather data: ${weatherJson}${extrasText}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from OpenAI");
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Invalid JSON response from OpenAI");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }, getConfig().get("retries"));

      const summarySchema = z.object({
        briefing: z.string().min(1),
        tips: z.array(z.string()).min(0),
      });

      const validatedSummary = summarySchema.parse(response);
      return validatedSummary;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid summary structure: ${error.errors.map((e) => e.message).join(", ")}`
        );
      }
      throw new Error(
        `Failed to generate summary: ${(error as Error).message}`
      );
    }
  }

  parseIntentFallback(query: string): WeatherIntent {
    const lowerQuery = query.toLowerCase();

    const cityPattern =
      /\b(?:in|for|at)\s+([A-Za-z\s]+?)(?:\s+(?:today|tomorrow|this|next|weekend|weather|forecast)|$)/g;
    const cities: string[] = [];
    let match;

    while ((match = cityPattern.exec(query)) !== null) {
      const city = match[1]?.trim();
      if (city && city.length > 1 && !cities.includes(city)) {
        cities.push(city);
      }
    }

    if (cities.length === 0) {
      if (lowerQuery.includes("here") || lowerQuery.includes("my location")) {
        return {
          cities: ["Unknown"],
          date: { kind: "today" },
          units: "imperial",
          useIpLocation: true,
          compare: false,
        };
      }
    }

    let dateKind: "today" | "tomorrow" | "range" = "today";
    let days: number | undefined;
    let weekend = false;

    if (lowerQuery.includes("tomorrow")) {
      dateKind = "tomorrow";
    } else if (lowerQuery.includes("weekend")) {
      dateKind = "range";
      weekend = true;
      days = 2;
    } else if (lowerQuery.includes("forecast") || lowerQuery.includes("next")) {
      dateKind = "range";
      days = 5;
    }

    const units =
      lowerQuery.includes("celsius") || lowerQuery.includes("c")
        ? "metric"
        : "imperial";

    const extras: string[] = [];
    if (lowerQuery.includes("umbrella")) extras.push("umbrella");
    if (lowerQuery.includes("rain") || lowerQuery.includes("precipitation"))
      extras.push("precipitation");
    if (lowerQuery.includes("wind")) extras.push("wind");
    if (lowerQuery.includes("uv") || lowerQuery.includes("sun"))
      extras.push("uv");

    const compare =
      lowerQuery.includes("compare") ||
      lowerQuery.includes("vs") ||
      lowerQuery.includes("versus");

    return {
      cities: cities.length > 0 ? cities : ["Unknown"],
      date: { kind: dateKind, days, weekend },
      units,
      extras: extras.length > 0 ? extras : undefined,
      useIpLocation: cities.length === 0,
      compare,
    };
  }
}

export const openAIService = new OpenAIService();
