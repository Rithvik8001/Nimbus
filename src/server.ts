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

config();

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
const PORT = process.env["PORT"] || 3000;

app.set("trust proxy", 1);

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

app.use(cors(corsOptions));

const limiter = rateLimit(rateLimitConfig);
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env["NODE_ENV"] === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
  app.use(requestLogger);
}

app.get("/health", healthCheck);

app.use("/api", weatherRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "Nimbus Weather API",
    version: process.env["npm_package_version"] || "1.0.0",
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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Nimbus Weather API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env["NODE_ENV"] || "development"}`);
});

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

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;
