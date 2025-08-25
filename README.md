# 🌤️ Nimbus Weather CLI

> **AI-powered Weather CLI with natural language processing** - Get weather information using simple, conversational commands!

[![npm version](https://badge.fury.io/js/nimbus-weather-cli.svg)](https://badge.fury.io/js/nimbus-weather-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **🤖 Natural Language Processing** - Ask weather questions in plain English
- **🌡️ US-Friendly Units** - Fahrenheit temperatures and miles by default
- **🎨 Beautiful Terminal Output** - Colorful, emoji-rich weather displays
- **🧠 AI-Powered Summaries** - Smart weather insights and tips
- **🌍 Global Coverage** - Weather data for any city worldwide
- **📍 IP Location Detection** - Get weather for your current location

## 🚀 Quick Start

### Installation

```bash
npm install -g nimbus-weather-cli
```

### Setup API Keys

Create a `.env` file in your home directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**Get your API keys:**

- **OpenAI API Key**: [Get yours here](https://platform.openai.com/api-keys)
- **OpenWeather API Key**: [Get yours here](https://openweathermap.org/api)

### Usage Examples

```bash
# Current weather (Fahrenheit by default)
nimbus weather "what's the weather in Miami today?"

# Tomorrow's weather
nimbus weather "do I need an umbrella in New York tomorrow?"

# 5-day forecast
nimbus weather "5 day forecast for Seattle"

# City comparison
nimbus weather "compare weather in Los Angeles and Chicago"

# Your current location
nimbus weather "weather here"

# Celsius override
nimbus weather "weather in Paris in Celsius"
```

## 📖 Sample Output

```
  _   _ ___ __  __ ____  _   _ ____
 | \ | |_ _|  \/  | __ )| | | / ___|
 |  \| || || |\/| |  _ \| | | \___ \
 | |\  || || |  | |_) | |_| |___) |
 |_| \_|___|_|  |_|____/ \___/|____/

AI-Powered Weather CLI

╭──────────────────────────────────────────────────────────────────────────────────╮
│                                                                                  │
│   Miami, US                                                                      │
│   ───────────                                                                    │
│                                                                                  │
│   Current Weather                                                                │
│   ───────────────                                                                │
│   ☁️ 92°F (feels like 105°F)                                                     │
│   broken clouds                                                                  │
│   🌬️  10 mph SE | 💧 66% | 📊 1016hPa                                           │
│   👁️  6mi | 🕐 3:03 PM                                                           │
│                                                                                  │
│   AI Summary                                                                     │
│   ───────────                                                                    │
│   Currently in Miami, US 🌥️. Temperature: 92.21°F, feels like 104.81°F.        │
│   Humidity: 66%. Wind speed: 10.36 mph.                                         │
│                                                                                  │
╰──────────────────────────────────────────────────────────────────────────────────╯
```

## 🎯 Natural Language Examples

```bash
# Simple queries
nimbus weather "weather in Paris"
nimbus weather "temperature in Tokyo"
nimbus weather "forecast for Berlin"

# Complex queries
nimbus weather "do I need an umbrella tomorrow?"
nimbus weather "what's the weather like this weekend?"
nimbus weather "compare London and Paris weather"

# Location-based
nimbus weather "weather here"
nimbus weather "what's the weather at my location?"

# Unit preferences
nimbus weather "weather in Paris in Celsius"
nimbus weather "temperature in Berlin in Fahrenheit"
```

## ⚙️ Command Options

```bash
nimbus --help
```

### Available Options

- `-d, --debug` - Enable debug mode
- `-u, --units <units>` - Temperature units (metric|imperial)
- `-f, --format <format>` - Output format (detailed|simple)
- `-h, --help` - Display help information

### Examples

```bash
# Force Celsius
nimbus weather "weather in Tokyo" --units metric

# Force Fahrenheit
nimbus weather "weather in London" --units imperial

# Debug mode
nimbus weather "test query" --debug
```

## 🔧 Configuration

### Environment Variables

| Variable              | Description                                         | Required |
| --------------------- | --------------------------------------------------- | -------- |
| `OPENAI_API_KEY`      | Your OpenAI API key for natural language processing | ✅       |
| `OPENWEATHER_API_KEY` | Your OpenWeather API key for weather data           | ✅       |
| `NODE_ENV`            | Environment mode (development/production)           | ❌       |

### Default Settings

- **Temperature Units**: Fahrenheit (imperial)
- **Wind Speed**: Miles per hour
- **Visibility**: Miles
- **Pressure**: Hectopascals (hPa)

## 🐛 Troubleshooting

### Common Issues

**"Invalid API key" error**

- Verify your API keys are correct
- Check that your OpenWeather API key is activated (can take 2-4 hours)
- Ensure your OpenAI account has credits

**"City not found" error**

- Check the city name spelling
- Try using a more specific city name (e.g., "New York" instead of "NYC")

**"Network timeout" error**

- Check your internet connection
- Try again in a few minutes
- Use `--debug` flag for more details

### Debug Mode

For detailed error information, use debug mode:

```bash
nimbus weather "test query" --debug
```

## 🛠️ Development

```bash
# Clone and setup
git clone <repository-url>
cd nimbus
npm install

# Build and run
npm run build
npm start weather "what's the weather in Miami?"
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Why Nimbus?

**Nimbus** - named after the nimbus cloud, which brings rain and weather changes. Just like the cloud, our CLI brings weather information to your terminal with the power of AI!

---

**Made with ❤️ for weather enthusiasts and CLI lovers everywhere!**

[![npm](https://img.shields.io/npm/v/nimbus-weather-cli.svg)](https://www.npmjs.com/package/nimbus-weather-cli)
[![npm downloads](https://img.shields.io/npm/dm/nimbus-weather-cli.svg)](https://www.npmjs.com/package/nimbus-weather-cli)
