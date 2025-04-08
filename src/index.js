import express from 'express';
import cors from 'cors';
import config from './config/config.js';
import { connectDB } from './config/db.config.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

// Import routes
import commodityRoutes from './routes/commodity.routes.js';
import customerRoutes from './routes/customer.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import earningRoutes from './routes/earning.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Development logging
if (config.isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// API routes
const apiPath = config.apiVersion ? `/api/${config.apiVersion}` : '/api';
app.use(`${apiPath}/commodities`, commodityRoutes);
app.use(`${apiPath}/customers`, customerRoutes);
app.use(`${apiPath}/expenses`, expenseRoutes);
app.use(`${apiPath}/payments`, paymentRoutes);
app.use(`${apiPath}/earnings`, earningRoutes);
app.use(`${apiPath}/dashboard`, dashboardRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running in ${config.env} mode on port ${config.port}`);
}); 