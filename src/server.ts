import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { config } from "dotenv";
import { AppConfig } from "./config/index.js";
import { weatherRoutes } from "./api/routes.js";
import {
  errorHandler,
  requestLogger,
  healthCheck,
  corsOptions,
  rateLimitConfig,
} from "./api/middleware.js";

// Load environment variables
config();

// Initialize configuration (validates API keys)
try {
  AppConfig.getInstance();
} catch (error) {
  console.error(
    "❌ Server startup failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}

const app = express();
const PORT = process.env['PORT'] || 3000;

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit(rateLimitConfig);
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env['NODE_ENV'] === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
  app.use(requestLogger);
}

// Health check endpoint (before other routes)
app.get("/health", healthCheck);

// API routes
app.use("/api", weatherRoutes);

// Root endpoint with API information
app.get("/", (_req, res) => {
  res.json({
    name: "Nimbus Weather API",
    version: process.env['npm_package_version'] || "1.0.0",
    description: "AI-powered Weather API with natural language processing",
    endpoints: {
      health: "GET /health",
      weather: "POST /api/weather",
      forecast: "GET /api/forecast",
      compare: "POST /api/compare",
      location: "GET /api/location",
    },
    documentation:
      "https://github.com/your-username/nimbus-weather-cli#api-documentation",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Nimbus Weather API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env['NODE_ENV'] || "development"}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;
