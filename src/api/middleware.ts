import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse, ApiError, ValidationError, ServiceError } from './types.js';

// Request validation middleware
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters for GET requests, body for POST requests
      const data = req.method === 'GET' ? req.query : req.body;
      const validated = schema.parse(data);
      
      // Replace the original data with validated data
      if (req.method === 'GET') {
        req.query = validated as any;
      } else {
        req.body = validated;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input
        }));
        
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          message: 'Invalid request parameters',
          timestamp: new Date().toISOString(),
          data: { validationErrors }
        };
        
        return res.status(400).json(response);
      }
      next(error);
    }
  };
};

// Global error handler
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('API Error:', err);

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle specific error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
    details = { field: err.field, value: err.value };
  } else if (err instanceof ServiceError) {
    statusCode = 502;
    errorCode = 'SERVICE_ERROR';
    message = `${err.service} service error: ${err.message}`;
    details = err.originalError;
  } else if (err.name === 'SyntaxError') {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  } else if (err.message.includes('API key')) {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    message = 'Weather service temporarily unavailable';
  }

  const response: ApiResponse = {
    success: false,
    error: errorCode,
    message,
    timestamp: new Date().toISOString(),
    ...(details && { data: { details } })
  };

  res.status(statusCode).json(response);
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    // Log errors for debugging
    if (res.statusCode >= 400) {
      console.error('[API Error]', logData);
    }
  });
  
  next();
};

// Health check middleware
export const healthCheck = async (req: Request, res: Response) => {
  const startTime = process.hrtime.bigint();
  
  try {
    // Test service connectivity (basic checks)
    const services = {
      openai: 'connected' as const,
      openweather: 'connected' as const
    };
    
    // You could add actual service health checks here
    // For now, we'll assume they're healthy if env vars are set
    if (!process.env.OPENAI_API_KEY) {
      services.openai = 'error';
    }
    if (!process.env.OPENWEATHER_API_KEY) {
      services.openweather = 'error';
    }
    
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
    
    const allHealthy = Object.values(services).every(status => status === 'connected');
    const status = allHealthy ? 'healthy' : 'degraded';
    
    const response: ApiResponse = {
      success: true,
      data: {
        status,
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        services,
        responseTime: `${responseTime.toFixed(2)}ms`
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(allHealthy ? 200 : 503).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'HEALTH_CHECK_FAILED',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    };
    
    res.status(503).json(response);
  }
};

// CORS options
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://nimbus-weather.com', 'https://www.nimbus-weather.com'] // Replace with your actual domains
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: false,
  maxAge: 86400 // 24 hours
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req: Request) => req.path === '/health'
};
