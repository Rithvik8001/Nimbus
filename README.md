# 🌤️ Nimbus Weather CLI

> Get instant weather forecasts and AI-powered insights from your terminal using natural language queries.

[![npm version](https://badge.fury.io/js/nimbus-weather-cli.svg)](https://badge.fury.io/js/nimbus-weather-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ What is Nimbus?

Nimbus is a modern command-line weather tool that understands natural language. Instead of remembering complex commands or options, just ask for weather information the way you'd ask a friend.

**Ask naturally:**

- "What's the weather in Paris today?"
- "Do I need an umbrella tomorrow?"
- "5 day forecast for Tokyo"
- "Compare weather in NYC and LA"

**Get smart answers:**

- Real-time weather data
- AI-powered summaries and tips
- Beautiful terminal output
- Support for any city worldwide

## 🚀 Quick Start

### Installation

```bash
npm install -g nimbus-weather-cli
```

### Usage

```bash
# Current weather
nimbus weather "weather in London"

# Tomorrow's forecast
nimbus weather "do I need a jacket tomorrow in Boston?"

# Multi-day forecast
nimbus weather "5 day forecast for Seattle"

# Weather comparison
nimbus weather "compare weather in Miami and Denver"

# Local weather (uses your IP location)
nimbus weather "weather near me"
```

## 📖 Examples

### Basic Weather Queries

```bash
nimbus weather "weather in Paris"
nimbus weather "temperature in Tokyo"
nimbus weather "is it raining in Seattle?"
```

### Forecast Questions

```bash
nimbus weather "will it rain tomorrow?"
nimbus weather "weather this weekend"
nimbus weather "next 3 days forecast for Miami"
```

### Travel Planning

```bash
nimbus weather "compare London and Paris weather"
nimbus weather "weather in Bali next week"
nimbus weather "should I pack warm clothes for Chicago?"
```

### Smart Questions

```bash
nimbus weather "do I need an umbrella in NYC?"
nimbus weather "is it beach weather in San Diego?"
nimbus weather "good day for hiking in Denver?"
```

## 🎨 Sample Output

```
🌤️  NIMBUS
AI-Powered Weather CLI

╭─────────────────────────────────────────────────────────────────╮
│                                                                 │
│  Paris, FR                                                      │
│  ──────────                                                     │
│                                                                 │
│  Current Weather                                                │
│  ───────────────                                                │
│  ☀️ 75°F (feels like 78°F)                                      │
│  clear sky                                                      │
│  🌬️ 8 mph NW | 💧 45% | 📊 1013hPa                              │
│  👁️ 6mi | 🕐 2:30 PM                                            │
│                                                                 │
│  AI Summary                                                     │
│  ───────────                                                    │
│  Perfect sunny afternoon in Paris! Clear skies and comfortable  │
│  temperatures make it ideal for outdoor activities. Light       │
│  winds from the northwest. No rain expected today.              │
│                                                                 │
│  💡 Tips:                                                       │
│  • Great day for sightseeing                                   │
│  • Light clothing recommended                                   │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

## ⚙️ Commands

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `nimbus weather [query]` | Get weather information using natural language |
| `nimbus health`          | Check service status                           |
| `nimbus help`            | Show help information                          |

## 🔧 Options

| Option        | Description                                | Default    |
| ------------- | ------------------------------------------ | ---------- |
| `-u, --units` | Temperature units (`metric` or `imperial`) | `imperial` |
| `-d, --debug` | Enable debug mode                          | `false`    |

## 🌍 Global Support

- **Cities**: Any city worldwide
- **Languages**: Natural English queries
- **Units**: Both metric (°C, km/h) and imperial (°F, mph)
- **Timezone**: Automatic local time detection

## 🔒 Privacy & Security

- No API keys required from users
- No personal data stored
- No registration needed
- Secure HTTPS connections

## 🛠️ For Developers

### Requirements

- Node.js 16+
- npm or yarn

### Development

```bash
git clone https://github.com/your-username/nimbus-weather-cli
cd nimbus-weather-cli
npm install
npm run build
npm start weather "test query"
```

### Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Watch mode development
- `npm start` - Run CLI
- `npm test` - Run tests

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 🆘 Support

Having issues? Check our [troubleshooting guide](https://github.com/your-username/nimbus-weather-cli/issues) or create a new issue.

---

**Made with ❤️ for weather enthusiasts and CLI lovers everywhere!**

[![npm](https://img.shields.io/npm/v/nimbus-weather-cli.svg)](https://www.npmjs.com/package/nimbus-weather-cli)
[![npm downloads](https://img.shields.io/npm/dm/nimbus-weather-cli.svg)](https://www.npmjs.com/package/nimbus-weather-cli)
