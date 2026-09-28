import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use(healthRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Risorsa non trovata' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Errore interno del server' });
  };
  app.use(errorHandler);

  return app;
}
