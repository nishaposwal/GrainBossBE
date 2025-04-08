import config from '../config/config.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log error in development
  if (config.isDevelopment) {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    message: err.message,
    // Only send stack trace in development
    stack: config.isDevelopment ? err.stack : undefined,
    // Include more error details in development
    details: config.isDevelopment ? err : undefined
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}; 