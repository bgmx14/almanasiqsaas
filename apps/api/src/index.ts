import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { EmailService } from './services/email.service';
import routes from './routes';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api', routes);

// WebSocket
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    logger.info(`Client ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId: string) => {
    socket.leave(roomId);
    logger.info(`Client ${socket.id} left room ${roomId}`);
  });
});

// Make io available throughout the app
app.set('io', io);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 OmraFlow API server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 API URL: ${process.env.API_URL || `http://localhost:${PORT}`}`);

  // Initialize email service
  const emailConfigured = EmailService.initialize();
  if (emailConfigured) {
    logger.info('✉️  Email service configured and ready');
  } else {
    logger.warn('⚠️  Email service not configured (SMTP credentials missing)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
