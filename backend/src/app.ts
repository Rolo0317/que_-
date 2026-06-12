import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { env } from './config/env.js';
import { router } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', router);

  const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ message: 'Error interno del servidor.' });
  };

  app.use(errorHandler);

  return app;
}
