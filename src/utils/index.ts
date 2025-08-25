/**
 * Utility functions for the Nimbus Weather CLI
 */

/**
 * Map OpenWeather weather conditions to emojis
 */
export const getWeatherEmoji = (main: string, description: string): string => {
  const weatherMap: Record<string, string> = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Smoke: "🌫️",
    Haze: "🌫️",
    Dust: "🌫️",
    Fog: "🌫️",
    Sand: "🌫️",
    Ash: "🌫️",
    Squall: "🌬️",
    Tornado: "🌪️",
  };

  // Check for specific conditions in description
  const desc = description.toLowerCase();
  if (desc.includes("thunderstorm")) return "⛈️";
  if (desc.includes("drizzle")) return "🌦️";
  if (desc.includes("rain")) return "🌧️";
  if (desc.includes("snow")) return "❄️";
  if (desc.includes("fog") || desc.includes("mist")) return "🌫️";
  if (desc.includes("clouds")) return "☁️";
  if (desc.includes("clear")) return "☀️";

  return weatherMap[main] || "🌡️";
};

/**
 * Format temperature with units
 */
export const formatTemperature = (
  temp: number,
  units: "metric" | "imperial"
): string => {
  const symbol = units === "metric" ? "°C" : "°F";
  return `${Math.round(temp)}${symbol}`;
};

/**
 * Format wind speed with units
 */
export const formatWindSpeed = (
  speed: number,
  units: "metric" | "imperial"
): string => {
  const unit = units === "metric" ? "m/s" : "mph";
  return `${Math.round(speed)} ${unit}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time for display
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Get relative time description
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInHours =
    Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return formatDate(date);
};

/**
 * Convert wind direction degrees to cardinal direction
 */
export const getWindDirection = (degrees: number): string => {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] || "N";
};

/**
 * Get UV index description
 */
export const getUvDescription = (uv: number): string => {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
};

/**
 * Get UV emoji
 */
export const getUvEmoji = (uv: number): string => {
  if (uv <= 2) return "😎";
  if (uv <= 5) return "😐";
  if (uv <= 7) return "😰";
  if (uv <= 10) return "😱";
  return "☠️";
};

/**
 * Group forecast data by day
 */
export const groupForecastByDay = <T extends { date: Date }>(
  forecast: T[]
): Map<string, T[]> => {
  const grouped = new Map<string, T[]>();

  forecast.forEach((item) => {
    const dayKey = item.date.toISOString().split("T")[0];
    if (dayKey && !grouped.has(dayKey)) {
      grouped.set(dayKey, []);
    }
    if (dayKey) {
      const existing = grouped.get(dayKey);
      if (existing) {
        existing.push(item);
      }
    }
  });

  return grouped;
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
};

/**
 * Validate city name format
 */
export const isValidCityName = (city: string): boolean => {
  // Basic validation: city should be 2-50 characters, alphanumeric with spaces and common punctuation
  const cityRegex = /^[a-zA-Z\s\-'\.]{2,50}$/;
  return cityRegex.test(city.trim());
};

/**
 * Normalize city name
 */
export const normalizeCityName = (city: string): string => {
  return city.trim().replace(/\s+/g, " ");
};

/**
 * Get temperature color based on value and units
 */
export const getTemperatureColor = (
  temp: number,
  units: "metric" | "imperial"
): string => {
  // Convert to Celsius for consistent color mapping
  const tempC = units === "imperial" ? ((temp - 32) * 5) / 9 : temp;

  if (tempC < 0) return "blue";
  if (tempC < 10) return "cyan";
  if (tempC < 20) return "green";
  if (tempC < 30) return "yellow";
  if (tempC < 40) return "red";
  return "magenta";
};
