import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { config } from './config.js';
import { HttpError } from './lib/http.js';
import { authRouter } from './routes/auth.js';
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
  app.use(authRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Risorsa non trovata' });
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, details: err.details });
      return;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        res.status(404).json({ error: 'Risorsa non trovata' });
        return;
      }
      if (err.code === 'P2002') {
        res.status(409).json({ error: 'Esiste già un elemento con questi dati', details: err.meta });
        return;
      }
      if (err.code === 'P2003') {
        res.status(409).json({ error: 'Operazione impossibile: elemento collegato ad altri dati' });
        return;
      }
    }
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'JSON non valido' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Errore interno del server' });
  };
  app.use(errorHandler);

  return app;
}
