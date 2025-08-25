import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, units = "imperial" } = req.body;

    if (!query) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Query parameter is required",
      });
    }

    console.log(`🌤️  Processing weather query: "${query}" (units: ${units})`);

    // Step 1: Parse query with OpenAI
    const aiResponse = await parseQueryWithAI(query, units);

    // Step 2: Get weather data (pass user IP for geolocation)
    const userIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress;
    const weatherData = await getWeatherData(aiResponse.location, units, userIP as string);

    // Step 3: Generate AI summary
    const aiSummary = await generateAISummary(weatherData, query, units);

    // Combine all data
    const response = {
      ...weatherData,
      aiSummary: aiSummary.summary,
      aiTips: aiSummary.tips,
      query: query,
      units: units,
    };

    res.json(response);
  } catch (error: any) {
    console.error("❌ Weather API Error:", error.message);

    if (error.response?.status === 401) {
      res.status(500).json({
        error: "API Configuration Error",
        message: "Invalid API credentials",
      });
    } else if (error.response?.status === 404) {
      res.status(404).json({
        error: "Location Not Found",
        message: "Could not find the requested location",
      });
    } else {
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to process weather request",
      });
    }
  }
}

// Parse query with OpenAI
async function parseQueryWithAI(query: string, units: string) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a weather query parser. Extract location and forecast type from user queries.
            
Default to "${units}" units unless the user specifically requests otherwise.

Return JSON only: {"location": "city,country", "type": "current|forecast", "days": number}

Examples:
- "weather in Paris" → {"location": "Paris,FR", "type": "current", "days": 1}
- "5 day forecast Tokyo" → {"location": "Tokyo,JP", "type": "forecast", "days": 5}
- "weather here" → {"location": "auto", "type": "current", "days": 1}`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 100,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    return JSON.parse(content);
  } catch (error) {
    console.log("⚠️  AI parsing failed, using fallback");
    // Fallback parsing
    return {
      location: query.includes("here")
        ? "auto"
        : extractLocationFallback(query),
      type:
        query.includes("forecast") || query.includes("day")
          ? "forecast"
          : "current",
      days: extractDaysFallback(query),
    };
  }
}

// Fallback location extraction
function extractLocationFallback(query: string): string {
  const words = query.toLowerCase().split(" ");
  const stopWords = [
    "weather",
    "in",
    "for",
    "at",
    "the",
    "what",
    "is",
    "how",
    "will",
    "be",
  ];
  const locationWords = words.filter(
    (word) => !stopWords.includes(word) && word.length > 2
  );
  return locationWords.join(" ") || "New York";
}

// Fallback days extraction
function extractDaysFallback(query: string): number {
  const match = query.match(/(\d+)\s*day/i);
  return match ? parseInt(match[1]!) : 1;
}

// Get weather data from OpenWeather
async function getWeatherData(location: string, units: string, userIP?: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const unitsParam = units === "metric" ? "metric" : "imperial";

  // Handle auto location using IP geolocation
  if (location === "auto") {
    try {
      // Use user's IP for geolocation, or fall back to ip-api's auto-detection
      const geoUrl = userIP 
        ? `http://ip-api.com/json/${userIP}` 
        : 'http://ip-api.com/json/';
        
      const ipResponse = await axios.get(geoUrl, {
        timeout: 5000
      });
      
      if (ipResponse.data.status === 'success') {
        location = `${ipResponse.data.city},${ipResponse.data.regionName},${ipResponse.data.countryCode}`;
        console.log(`🌍 Detected location via IP (${userIP || 'auto'}): ${location}`);
      } else {
        location = "New York,US"; // Fallback
        console.log('⚠️  IP geolocation failed, using NYC as fallback');
      }
    } catch (error) {
      location = "New York,US"; // Fallback on error
      console.log('⚠️  IP geolocation error, using NYC as fallback:', error.message);
    }
  }

  // Get current weather
  const currentResponse = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=${unitsParam}`
  );

  // Get forecast
  const forecastResponse = await axios.get(
    `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=${unitsParam}`
  );

  // Transform to expected format
  return {
    location: {
      name: currentResponse.data.name,
      country: currentResponse.data.sys.country,
      region: currentResponse.data.sys.country,
      lat: currentResponse.data.coord.lat,
      lon: currentResponse.data.coord.lon,
      localtime: new Date().toLocaleString(),
    },
    current: {
      temp_c:
        units === "metric"
          ? currentResponse.data.main.temp
          : ((currentResponse.data.main.temp - 32) * 5) / 9,
      temp_f:
        units === "metric"
          ? (currentResponse.data.main.temp * 9) / 5 + 32
          : currentResponse.data.main.temp,
      feelslike_c:
        units === "metric"
          ? currentResponse.data.main.feels_like
          : ((currentResponse.data.main.feels_like - 32) * 5) / 9,
      feelslike_f:
        units === "metric"
          ? (currentResponse.data.main.feels_like * 9) / 5 + 32
          : currentResponse.data.main.feels_like,
      condition: {
        text: currentResponse.data.weather[0].description,
        icon: `//openweathermap.org/img/w/${currentResponse.data.weather[0].icon}.png`,
        code: currentResponse.data.weather[0].id,
      },
      wind_mph:
        units === "imperial"
          ? currentResponse.data.wind.speed
          : currentResponse.data.wind.speed * 2.237,
      wind_kph:
        units === "metric"
          ? currentResponse.data.wind.speed * 3.6
          : currentResponse.data.wind.speed * 1.609,
      wind_dir: degreeToDirection(currentResponse.data.wind.deg || 0),
      wind_degree: currentResponse.data.wind.deg || 0,
      pressure_mb: currentResponse.data.main.pressure,
      pressure_in: currentResponse.data.main.pressure * 0.02953,
      humidity: currentResponse.data.main.humidity,
      cloud: currentResponse.data.clouds.all,
      vis_km: 10, // OpenWeather doesn't provide visibility
      vis_miles: 6,
      uv: 5, // OpenWeather doesn't provide UV in free tier
    },
    forecast: forecastResponse.data.list.slice(0, 5).map((item: any) => ({
      date: item.dt_txt.split(" ")[0],
      date_epoch: item.dt,
      day: {
        maxtemp_c:
          units === "metric"
            ? item.main.temp_max
            : ((item.main.temp_max - 32) * 5) / 9,
        maxtemp_f:
          units === "metric"
            ? (item.main.temp_max * 9) / 5 + 32
            : item.main.temp_max,
        mintemp_c:
          units === "metric"
            ? item.main.temp_min
            : ((item.main.temp_min - 32) * 5) / 9,
        mintemp_f:
          units === "metric"
            ? (item.main.temp_min * 9) / 5 + 32
            : item.main.temp_min,
        avgtemp_c:
          units === "metric" ? item.main.temp : ((item.main.temp - 32) * 5) / 9,
        avgtemp_f:
          units === "metric" ? (item.main.temp * 9) / 5 + 32 : item.main.temp,
        condition: {
          text: item.weather[0].description,
          icon: `//openweathermap.org/img/w/${item.weather[0].icon}.png`,
          code: item.weather[0].id,
        },
        daily_chance_of_rain: item.pop * 100,
        avghumidity: item.main.humidity,
      },
    })),
  };
}

// Convert wind degree to direction
function degreeToDirection(degree: number): string {
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
  return directions[Math.round(degree / 22.5) % 16]!;
}

// Generate AI summary
async function generateAISummary(
  weatherData: any,
  query: string,
  units: string
) {
  try {
    const tempUnit = units === "metric" ? "°C" : "°F";
    const speedUnit = units === "metric" ? "km/h" : "mph";

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful weather assistant. Provide a brief, conversational summary of the weather data and 2-3 practical tips.

Return JSON: {"summary": "brief weather summary", "tips": ["tip1", "tip2", "tip3"]}`,
          },
          {
            role: "user",
            content: `Weather in ${weatherData.location.name}: ${weatherData.current.condition.text}, ${Math.round(units === "metric" ? weatherData.current.temp_c : weatherData.current.temp_f)}${tempUnit}, ${Math.round(weatherData.current.humidity)}% humidity, ${Math.round(units === "metric" ? weatherData.current.wind_kph : weatherData.current.wind_mph)} ${speedUnit} wind. User asked: "${query}"`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    return JSON.parse(content);
  } catch (error) {
    console.log("⚠️  AI summary failed, using fallback");
    return {
      summary: `Currently ${weatherData.current.condition.text} with ${Math.round(units === "metric" ? weatherData.current.temp_c : weatherData.current.temp_f)}${units === "metric" ? "°C" : "°F"} in ${weatherData.location.name}.`,
      tips: [
        "Check the weather regularly",
        "Dress appropriately for the conditions",
      ],
    };
  }
}
