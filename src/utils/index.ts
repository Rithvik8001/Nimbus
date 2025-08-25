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

export const formatTemperature = (
  temp: number,
  units: "metric" | "imperial"
): string => {
  const symbol = units === "metric" ? "°C" : "°F";
  return `${Math.round(temp)}${symbol}`;
};

export const formatWindSpeed = (
  speed: number,
  units: "metric" | "imperial"
): string => {
  const unit = units === "metric" ? "m/s" : "mph";
  return `${Math.round(speed)} ${unit}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

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

export const getUvDescription = (uv: number): string => {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
};

export const getUvEmoji = (uv: number): string => {
  if (uv <= 2) return "😎";
  if (uv <= 5) return "😐";
  if (uv <= 7) return "😰";
  if (uv <= 10) return "😱";
  return "☠️";
};

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

      const waitTime = delay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
};

export const isValidCityName = (city: string): boolean => {
  const cityRegex = /^[a-zA-Z\s\-'\.]{2,50}$/;
  return cityRegex.test(city.trim());
};

export const normalizeCityName = (city: string): string => {
  return city.trim().replace(/\s+/g, " ");
};

export const getTemperatureColor = (
  temp: number,
  units: "metric" | "imperial"
): string => {
  const tempC = units === "imperial" ? ((temp - 32) * 5) / 9 : temp;

  if (tempC < 0) return "blue";
  if (tempC < 10) return "cyan";
  if (tempC < 20) return "green";
  if (tempC < 30) return "yellow";
  if (tempC < 40) return "red";
  return "magenta";
};
