import chalk from "chalk";
import boxen from "boxen";
import figlet from "figlet";
import {
  WeatherData,
  WeatherSummary,
  WeatherIntent,
  CliOptions,
} from "../types/index.js";
import {
  getWeatherEmoji,
  formatTemperature,
  formatWindSpeed,
  formatDate,
  formatTime,
  getWindDirection,
  getTemperatureColor,
} from "../utils/index.js";

const getChalkColor = (color: string) => {
  const chalkColors: Record<string, any> = chalk;
  return chalkColors[color] || chalk.white;
};

export class WeatherRenderer {
  private options: CliOptions;

  constructor(options: CliOptions) {
    this.options = options;
  }

  renderWeather(
    weatherData: WeatherData | WeatherData[],
    summary: WeatherSummary | null,
    intent: WeatherIntent
  ): void {
    // Render banner
    this.renderBanner();

    // Render weather data
    if (Array.isArray(weatherData)) {
      this.renderComparison(weatherData, summary, intent);
    } else {
      this.renderSingleCity(weatherData, summary, intent);
    }
  }

  private renderBanner(): void {
    const banner = figlet.textSync("NIMBUS", {
      font: "Standard",
      horizontalLayout: "default",
      verticalLayout: "default",
    });

    console.log(chalk.blue(banner));
    console.log(chalk.gray("AI-Powered Weather CLI") + "\n");
  }

  private renderSingleCity(
    weatherData: WeatherData,
    summary: WeatherSummary | null,
    intent: WeatherIntent
  ): void {
    const { city, country, current, forecast } = weatherData;
    const location = `${city}, ${country}`;

    let content = "";

    content += chalk.bold.white(`${location}\n`);
    content += chalk.gray("─".repeat(location.length + 2)) + "\n\n";

    if (current) {
      content += this.renderCurrentWeather(current, intent.units);
      content += "\n";
    }

    if (forecast && forecast.length > 0) {
      content += this.renderForecast(forecast, intent.units);
      content += "\n";
    }

    if (summary) {
      content += this.renderSummary(summary);
    }

    const boxedContent = boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
      backgroundColor: "black",
    });

    console.log(boxedContent);
  }

  private renderComparison(
    weatherDataArray: WeatherData[],
    summary: WeatherSummary | null,
    intent: WeatherIntent
  ): void {
    let content = chalk.bold.white("Weather Comparison\n");
    content += chalk.gray("─".repeat(20)) + "\n\n";

    weatherDataArray.forEach((weatherData, index) => {
      const { city, country, current, forecast } = weatherData;
      const location = `${city}, ${country}`;

      content += chalk.bold.cyan(`${index + 1}. ${location}\n`);

      if (current) {
        const temp = formatTemperature(current.temperature, intent.units);
        const tempColor = getTemperatureColor(
          current.temperature,
          intent.units
        );
        const emoji = getWeatherEmoji(current.main, current.description);

        content += `   ${emoji} ${getChalkColor(tempColor)(temp)} | ${current.description}\n`;
      }

      if (forecast && forecast.length > 0) {
        const firstDay = forecast[0];
        if (firstDay) {
          const tempRange = `${formatTemperature(firstDay.temperature.min, intent.units)} - ${formatTemperature(firstDay.temperature.max, intent.units)}`;
          const emoji = getWeatherEmoji(firstDay.main, firstDay.description);

          content += `   ${emoji} ${tempRange} | ${firstDay.description}\n`;
        }
      }

      content += "\n";
    });

    if (summary) {
      content += this.renderSummary(summary);
    }

    const boxedContent = boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "cyan",
      backgroundColor: "black",
    });

    console.log(boxedContent);
  }

  private renderCurrentWeather(
    current: WeatherData["current"],
    units: "metric" | "imperial"
  ): string {
    if (!current) return "";

    const emoji = getWeatherEmoji(current.main, current.description);
    const temp = formatTemperature(current.temperature, units);
    const feelsLike = formatTemperature(current.feelsLike, units);
    const tempColor = getTemperatureColor(current.temperature, units);
    const windSpeed = formatWindSpeed(current.windSpeed, units);
    const windDir = getWindDirection(current.windDirection);
    const time = formatTime(current.timestamp);

    let content = chalk.bold.white("Current Weather\n");
    content += chalk.gray("─".repeat(15)) + "\n";
    content += `${emoji} ${getChalkColor(tempColor).bold(temp)} (feels like ${getChalkColor(tempColor)(feelsLike)})\n`;
    content += `${chalk.gray(current.description)}\n`;
    content += `🌬️  ${windSpeed} ${windDir} | 💧 ${current.humidity}% | 📊 ${current.pressure}hPa\n`;
    const visibility =
      units === "imperial"
        ? `${Math.round(current.visibility * 0.000621371)}mi`
        : `${current.visibility / 1000}km`;
    content += `👁️  ${visibility} | 🕐 ${time}\n`;

    return content;
  }

  private renderForecast(
    forecast: WeatherData["forecast"],
    units: "metric" | "imperial"
  ): string {
    if (!forecast || forecast.length === 0) return "";

    let content = chalk.bold.white("Forecast\n");
    content += chalk.gray("─".repeat(8)) + "\n";

    forecast.forEach((day) => {
      const emoji = getWeatherEmoji(day.main, day.description);
      const date = formatDate(day.date);
      const tempRange = `${formatTemperature(day.temperature.min, units)} - ${formatTemperature(day.temperature.max, units)}`;
      const tempColor = getTemperatureColor(day.temperature.max, units);
      const windSpeed = formatWindSpeed(day.windSpeed, units);
      const precipProb = day.precipitationProbability;

      content += `${chalk.cyan(date)} ${emoji} ${getChalkColor(tempColor)(tempRange)}\n`;
      content += `   ${chalk.gray(day.description)} | 💧 ${precipProb}% | 🌬️ ${windSpeed}\n`;
    });

    return content;
  }

  private renderSummary(summary: WeatherSummary): string {
    let content = "\n" + chalk.bold.white("AI Summary\n");
    content += chalk.gray("─".repeat(11)) + "\n";
    content += chalk.italic(summary.briefing) + "\n";

    if (summary.tips && summary.tips.length > 0) {
      content += "\n" + chalk.yellow("💡 Tips:\n");
      summary.tips.forEach((tip) => {
        content += `   • ${tip}\n`;
      });
    }

    return content;
  }

  renderError(message: string, details?: string): void {
    const content =
      chalk.red(`❌ ${message}`) + (details ? "\n" + chalk.gray(details) : "");

    const boxedContent = boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
      backgroundColor: "black",
    });

    console.log(boxedContent);
  }

  renderDebug(info: object): void {
    if (!this.options.debug) return;

    const content = chalk.gray("Debug Info:\n") + JSON.stringify(info, null, 2);

    const boxedContent = boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "gray",
      backgroundColor: "black",
    });

    console.log(boxedContent);
  }
}
