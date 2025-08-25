#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig } from './config/index.js';
import { WeatherCLI } from './cli/weather-cli.js';

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const program = new Command();
  const config = getConfig();

  // Set up the CLI program
  program
    .name('nimbus')
    .description('AI-powered Weather CLI with natural language processing')
    .version('1.0.0')
    .option('-d, --debug', 'Enable debug mode', false)
    .option('-u, --units <units>', 'Temperature units (metric|imperial)', 'metric')
    .option('-f, --format <format>', 'Output format (detailed|simple)', 'detailed');

  // Add the weather command
  program
    .command('weather')
    .description('Get weather information using natural language')
    .argument('[query...]', 'Natural language weather query')
    .action(async (query: string[], options: any) => {
      try {
        // Validate API keys
        config.validateApiKeys();

        // Set debug mode
        if (options.debug) {
          config.getConfig().debug = true;
        }

        // Create weather CLI instance
        const weatherCLI = new WeatherCLI({
          debug: options.debug || config.isDebug(),
          units: options.units,
          format: options.format,
        });

        // Process the query
        const queryString = query.join(' ');
        if (!queryString.trim()) {
          console.log(chalk.blue('🌤️  Welcome to Nimbus Weather CLI!'));
          console.log(chalk.gray('Try: nimbus weather "what\'s the weather in Paris today?"'));
          console.log(chalk.gray('Or: nimbus weather "do I need an umbrella in London tomorrow?"'));
          return;
        }

        await weatherCLI.processQuery(queryString);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        
        if (config.isDebug()) {
          console.error(chalk.red('❌ Error:'), errorMessage);
          if (error instanceof Error && error.stack) {
            console.error(chalk.gray(error.stack));
          }
        } else {
          console.error(chalk.red('❌ Error:'), errorMessage);
          console.log(chalk.gray('Use --debug for more details'));
        }
        
        process.exit(1);
      }
    });

  // Add help command
  program
    .command('help')
    .description('Show detailed help information')
    .action(() => {
      console.log(chalk.blue.bold('🌤️  Nimbus Weather CLI Help'));
      console.log();
      console.log(chalk.yellow('Usage Examples:'));
      console.log(chalk.gray('  nimbus weather "what\'s the weather in Paris today?"'));
      console.log(chalk.gray('  nimbus weather "do I need an umbrella in London tomorrow?"'));
      console.log(chalk.gray('  nimbus weather "5 day forecast for Tokyo"'));
      console.log(chalk.gray('  nimbus weather "compare weather in New York and Los Angeles"'));
      console.log(chalk.gray('  nimbus weather "weather here" (uses your IP location)'));
      console.log();
      console.log(chalk.yellow('Options:'));
      console.log(chalk.gray('  -d, --debug     Enable debug mode'));
      console.log(chalk.gray('  -u, --units     Temperature units (metric|imperial)'));
      console.log(chalk.gray('  -f, --format    Output format (detailed|simple)'));
      console.log();
      console.log(chalk.yellow('Environment Variables:'));
      console.log(chalk.gray('  OPENAI_API_KEY      Your OpenAI API key'));
      console.log(chalk.gray('  OPENWEATHER_API_KEY Your OpenWeather API key'));
      console.log();
      console.log(chalk.yellow('Natural Language Examples:'));
      console.log(chalk.gray('  • "weather in Paris"'));
      console.log(chalk.gray('  • "do I need an umbrella tomorrow?"'));
      console.log(chalk.gray('  • "5 day forecast for Tokyo"'));
      console.log(chalk.gray('  • "compare London and Paris"'));
      console.log(chalk.gray('  • "weather here"'));
      console.log(chalk.gray('  • "temperature in Celsius for Berlin"'));
    });

  // Parse command line arguments
  try {
    await program.parseAsync();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(chalk.red('❌ CLI Error:'), errorMessage);
    
    if (config.isDebug() && error instanceof Error && error.stack) {
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error.message);
  if (getConfig().isDebug() && error.stack) {
    console.error(chalk.gray(error.stack));
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  process.exit(1);
});

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(chalk.red('❌ Fatal Error:'), error.message);
    if (getConfig().isDebug() && error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  });
}
