# Nimbus Weather API Documentation

The Nimbus Weather API provides AI-powered weather information through RESTful endpoints. It supports natural language queries, current weather, forecasts, and city comparisons.

## Base URL

```
http://localhost:3000
```

## Authentication

No authentication required. The API uses server-side API keys for OpenAI and OpenWeather services.

## Rate Limiting

- **Development**: 1000 requests per 15 minutes per IP
- **Production**: 100 requests per 15 minutes per IP
- Health check endpoint is exempt from rate limiting

## Common Headers

```
Content-Type: application/json
```

## Response Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": object | null,
  "error": string | null,
  "message": string | null,
  "timestamp": string
}
```

## Endpoints

### Health Check

Check API service status and connectivity.

**GET** `/health`

#### Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.3",
    "uptime": 3600.123,
    "services": {
      "openai": "connected",
      "openweather": "connected"
    },
    "responseTime": "12.34ms"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Natural Language Weather Query

Process free-form weather questions using AI.

**POST** `/api/weather`

#### Request Body

```json
{
  "query": "What's the weather like in Paris today?",
  "units": "imperial",
  "summary": true
}
```

#### Parameters

| Field   | Type    | Required | Default    | Description                       |
| ------- | ------- | -------- | ---------- | --------------------------------- |
| query   | string  | Yes      | -          | Natural language weather question |
| units   | string  | No       | "imperial" | "metric" or "imperial"            |
| summary | boolean | No       | false      | Include AI-generated summary      |

#### Response

```json
{
  "success": true,
  "data": {
    "weather": {
      "city": "Paris",
      "country": "FR",
      "temperature": 68,
      "feelsLike": 70,
      "description": "partly cloudy",
      "icon": "02d",
      "main": "Clouds",
      "humidity": 65,
      "pressure": 1013,
      "windSpeed": 8.5,
      "windDirection": "NW",
      "visibility": 6,
      "uvIndex": 4,
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "summary": "Currently in Paris 🌤️, it's 68°F with a gentle breeze. Perfect weather for a stroll!",
    "query": "What's the weather like in Paris today?",
    "location": "Paris"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### City Weather Forecast

Get detailed weather forecast for a specific city.

**GET** `/api/forecast`

#### Query Parameters

| Field   | Type    | Required | Default    | Description                            |
| ------- | ------- | -------- | ---------- | -------------------------------------- |
| city    | string  | Yes      | -          | City name (e.g., "London", "New York") |
| units   | string  | No       | "imperial" | "metric" or "imperial"                 |
| days    | number  | No       | 3          | Number of forecast days (1-10)         |
| summary | boolean | No       | false      | Include AI-generated summary           |

#### Example Request

```
GET /api/forecast?city=London&units=metric&days=5&summary=true
```

#### Response

```json
{
  "success": true,
  "data": {
    "current": {
      "city": "London",
      "country": "GB",
      "temperature": 15,
      "feelsLike": 13,
      "description": "light rain",
      "icon": "10d",
      "main": "Rain",
      "humidity": 78,
      "pressure": 1008,
      "windSpeed": 12,
      "windDirection": "SW",
      "visibility": 8,
      "uvIndex": 2,
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "forecast": [
      {
        "date": "2024-01-16T00:00:00.000Z",
        "temperature": { "min": 8, "max": 16 },
        "description": "overcast clouds",
        "icon": "04d",
        "main": "Clouds",
        "humidity": 72,
        "windSpeed": 15,
        "precipitationProbability": 20
      }
    ],
    "summary": "London shows rainy conditions today with temperatures around 15°C. Pack an umbrella! ☔",
    "city": "London",
    "days": 5
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Compare Cities Weather

Compare current weather across multiple cities.

**POST** `/api/compare`

#### Request Body

```json
{
  "cities": ["New York", "London", "Tokyo"],
  "units": "imperial",
  "summary": true
}
```

#### Parameters

| Field   | Type    | Required | Default    | Description                     |
| ------- | ------- | -------- | ---------- | ------------------------------- |
| cities  | array   | Yes      | -          | Array of city names (minimum 2) |
| units   | string  | No       | "imperial" | "metric" or "imperial"          |
| summary | boolean | No       | false      | Include AI-generated summary    |

#### Response

```json
{
  "success": true,
  "data": {
    "cities": [
      {
        "city": "New York",
        "country": "US",
        "temperature": 72,
        "description": "clear sky",
        "main": "Clear"
      },
      {
        "city": "London",
        "country": "GB",
        "temperature": 59,
        "description": "light rain",
        "main": "Rain"
      }
    ],
    "summary": "NYC enjoys sunny 72°F while London has rainy 59°F. Pack accordingly! ☀️🌧️",
    "comparedCities": ["New York", "London", "Tokyo"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Current Location

Get location information based on client IP address.

**GET** `/api/location`

#### Response

```json
{
  "success": true,
  "data": {
    "city": "San Francisco",
    "country": "US",
    "region": "California",
    "lat": 37.7749,
    "lon": -122.4194,
    "timezone": "America/Los_Angeles"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error description",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Common Error Codes

| Code                    | Status | Description                     |
| ----------------------- | ------ | ------------------------------- |
| `VALIDATION_ERROR`      | 400    | Invalid request parameters      |
| `NOT_FOUND`             | 404    | Endpoint not found              |
| `RATE_LIMIT_EXCEEDED`   | 429    | Too many requests               |
| `SERVICE_ERROR`         | 502    | External service error          |
| `SERVICE_UNAVAILABLE`   | 503    | Service temporarily unavailable |
| `INTERNAL_SERVER_ERROR` | 500    | Unexpected server error         |

### Example Error Response

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request parameters",
  "data": {
    "validationErrors": [
      {
        "field": "query",
        "message": "Query is required",
        "value": ""
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### cURL Examples

#### Natural Language Query

```bash
curl -X POST http://localhost:3000/api/weather \
  -H "Content-Type: application/json" \
  -d '{"query": "Do I need an umbrella in Seattle tomorrow?", "summary": true}'
```

#### Get Forecast

```bash
curl "http://localhost:3000/api/forecast?city=Miami&units=imperial&days=3"
```

#### Compare Cities

```bash
curl -X POST http://localhost:3000/api/compare \
  -H "Content-Type: application/json" \
  -d '{"cities": ["Paris", "Barcelona", "Rome"], "units": "metric"}'
```

### JavaScript/Node.js Example

```javascript
const axios = require("axios");

async function getWeather() {
  try {
    const response = await axios.post("http://localhost:3000/api/weather", {
      query: "What's the weather like in Tokyo?",
      units: "metric",
      summary: true,
    });

    console.log(response.data);
  } catch (error) {
    console.error("Error:", error.response.data);
  }
}

getWeather();
```

### Python Example

```python
import requests

def get_forecast(city, days=3):
    url = "http://localhost:3000/api/forecast"
    params = {
        "city": city,
        "units": "metric",
        "days": days,
        "summary": True
    }

    response = requests.get(url, params=params)
    return response.json()

# Usage
forecast = get_forecast("Berlin", 5)
print(forecast)
```

## Development

### Running the Server

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm run start:server

# Development mode with auto-reload
npm run dev:server
```

### Environment Variables

Create a `.env` file with:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
PORT=3000
NODE_ENV=development
```

### Server Configuration

- **Port**: Default 3000, configurable via `PORT` environment variable
- **CORS**: Configured for localhost in development
- **Rate Limiting**: 15-minute windows with IP-based tracking
- **Security**: Helmet.js security headers, request validation
- **Logging**: Morgan HTTP request logging

## Support

For issues and questions:

- GitHub Repository: [nimbus-weather-cli](https://github.com/your-username/nimbus-weather-cli)
- CLI Documentation: See README.md
- API Status: `GET /health`
