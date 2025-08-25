#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import figlet from "figlet";
import boxen from "boxen";
import { weatherApi } from "./services/weather-api.service.js";

/**
 * Simple weather CLI that uses deployed API server
 * No API keys required - uses cloud service
 */

function displayBanner(): void {
  const banner = figlet.textSync("NIMBUS", {
    font: "Standard",
    horizontalLayout: "default",
  });

  console.log(chalk.blue(banner));
  console.log(chalk.gray("AI-Powered Weather CLI\n"));
}

function formatWeatherOutput(data: any): void {
  let content = "";

  // Handle different response types
  if (data.weather) {
    if (Array.isArray(data.weather)) {
      // Multiple cities (comparison)
      content += chalk.bold.white("🌍 Weather Comparison\n");
      content += chalk.gray("─".repeat(20)) + "\n\n";

      data.weather.forEach((weather: any, index: number) => {
        content += chalk.cyan(`${weather.city}, ${weather.country}\n`);
        content += `🌡️ ${weather.current.temperature}°F (feels like ${weather.current.feelsLike}°F)\n`;
        content += `${weather.current.description}\n`;
        content += `💧 ${weather.current.humidity}% | 🌬️ ${Math.round(weather.current.windSpeed)} mph\n`;

        if (index < data.weather.length - 1) {
          content += "\n";
        }
      });
    } else {
      // Single location
      const weather = data.weather;
      content += chalk.bold.white(`${weather.city}, ${weather.country}\n`);
      content +=
        chalk.gray(
          "─".repeat(weather.city.length + weather.country.length + 2)
        ) + "\n\n";

      content += chalk.bold.white("Current Weather\n");
      content += chalk.gray("─".repeat(15)) + "\n";
      content += `🌡️ ${weather.current.temperature}°F (feels like ${weather.current.feelsLike}°F)\n`;
      content += `${weather.current.description}\n`;
      content += `🌬️ ${Math.round(weather.current.windSpeed)} mph | 💧 ${weather.current.humidity}% | 📊 ${weather.current.pressure}hPa\n`;
    }
  }

  // Handle forecast data
  if (data.forecast) {
    content += "\n\n" + chalk.bold.white("Forecast\n");
    content += chalk.gray("─".repeat(8)) + "\n";

    data.forecast.slice(0, 5).forEach((day: any) => {
      const date = new Date(day.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      content += `${chalk.cyan(date)} 🌡️ ${day.temperature.min}°F - ${day.temperature.max}°F\n`;
      content += `   ${day.description} | 💧 ${day.precipitationProbability}% | 🌬️ ${Math.round(day.windSpeed)} mph\n`;
    });
  }

  // Add AI summary if available
  if (data.summary) {
    content += "\n\n" + chalk.bold.white("AI Summary\n");
    content += chalk.gray("─".repeat(11)) + "\n";
    content += chalk.white(data.summary) + "\n";

    // Extract tips from summary (simple approach)
    if (
      data.summary.toLowerCase().includes("umbrella") ||
      data.summary.toLowerCase().includes("rain") ||
      data.summary.toLowerCase().includes("tip")
    ) {
      content += "\n" + chalk.bold.yellow("💡 Tips:\n");
      content += chalk.dim(
        "• Check the AI summary above for weather tips and recommendations.\n"
      );
    }
  }

  // Display in a nice box
  const boxedContent = boxen(content, {
    title: "AI-Powered Weather CLI",
    titleAlignment: "center",
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "blue",
  });

  console.log(boxedContent);
}

async function processWeatherQuery(query: string, options: any): Promise<void> {
  const spinner = ora("Getting weather information...").start();

  try {
    // Special case for health check
    if (
      query.toLowerCase().includes("health") ||
      query.toLowerCase().includes("status")
    ) {
      spinner.text = "Checking API server health...";
      const health = await weatherApi.checkHealth();
      spinner.stop();

      console.log(chalk.cyan("\n🔍 Service Status"));
      console.log(
        chalk.green(`Status: ${health.status?.toUpperCase() || "HEALTHY"}`)
      );
      console.log(chalk.blue(`Version: ${health.version || "1.0.0"}`));
      console.log(chalk.blue(`Response: ${health.responseTime || "Fast"}`));
      return;
    }

    // Process weather query
    const result = await weatherApi.processWeatherQuery(query, options.units);
    spinner.stop();

    // Display banner
    displayBanner();

    // Format and display results
    formatWeatherOutput(result);
  } catch (error) {
    spinner.stop();

    if (error instanceof Error) {
      if (error.message.includes("Network Error")) {
        console.error(chalk.red("\n❌ Connection failed"));
        console.error(
          chalk.yellow("Please check your internet connection and try again.")
        );
      } else if (error.message.includes("API Error")) {
        console.error(chalk.red(`\n❌ ${error.message}`));
      } else {
        console.error(chalk.red(`\n❌ ${error.message}`));
      }
    } else {
      console.error(chalk.red(`\n❌ Unexpected error occurred`));
    }

    if (options.debug) {
      console.error(
        chalk.dim(
          `\nDebug info: ${error instanceof Error ? error.stack : String(error)}`
        )
      );
    }

    process.exit(1);
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("nimbus")
    .description("AI-powered Weather CLI - No API keys required!")
    .version("1.2.0")
    .option("-d, --debug", "Enable debug mode", false)
    .option(
      "-u, --units <units>",
      "Temperature units (metric|imperial)",
      "imperial"
    );

  program
    .command("weather")
    .description("Get weather information using natural language")
    .argument("[query...]", "Natural language weather query")
    .action(async (query: string[], options: any) => {
      const queryString = query.join(" ");

      if (!queryString.trim()) {
        console.log(chalk.blue("🌤️  Nimbus Weather CLI"));
        console.log(
          chalk.gray("Get weather information using natural language\n")
        );

        console.log(chalk.yellow("Examples:"));
        console.log(chalk.gray('  nimbus weather "weather in Paris"'));
        console.log(
          chalk.gray('  nimbus weather "do I need an umbrella tomorrow?"')
        );
        console.log(chalk.gray('  nimbus weather "5 day forecast for Tokyo"'));
        console.log(
          chalk.gray('  nimbus weather "compare NYC and LA weather"')
        );
        console.log(chalk.gray('  nimbus weather "weather near me"'));
        return;
      }

      await processWeatherQuery(queryString, { ...options, ...program.opts() });
    });

  program
    .command("health")
    .description("Check Nimbus API server status")
    .action(async () => {
      await processWeatherQuery("health check", {
        units: "imperial",
        debug: false,
      });
    });

  program
    .command("help")
    .description("Show detailed help information")
    .action(() => {
      console.log(chalk.blue.bold("🌤️  Nimbus Weather CLI"));
      console.log(
        chalk.gray("AI-powered weather information using natural language\n")
      );

      console.log(chalk.yellow("Usage:"));
      console.log(chalk.gray('  nimbus weather "weather in Paris"'));
      console.log(
        chalk.gray('  nimbus weather "do I need an umbrella tomorrow?"')
      );
      console.log(chalk.gray('  nimbus weather "5 day forecast for Tokyo"'));
      console.log(chalk.gray('  nimbus weather "compare NYC and LA weather"'));
      console.log(chalk.gray('  nimbus weather "weather near me"\n'));

      console.log(chalk.yellow("Commands:"));
      console.log(chalk.gray("  weather [query]    Get weather information"));
      console.log(chalk.gray("  health             Check service status"));
      console.log(chalk.gray("  help               Show this help\n"));

      console.log(chalk.yellow("Options:"));
      console.log(chalk.gray("  -d, --debug        Enable debug mode"));
      console.log(
        chalk.gray("  -u, --units        Temperature units (metric|imperial)")
      );
    });

  try {
    await program.parseAsync();
  } catch (error) {
    console.error(
      chalk.red("❌ CLI Error:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Error handlers
process.on("uncaughtException", (error) => {
  console.error(chalk.red("❌ Uncaught Exception:"), error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(chalk.red("❌ Unhandled Rejection:"), String(reason));
  process.exit(1);
});

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(
      chalk.red("❌ Fatal Error:"),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  });
}
