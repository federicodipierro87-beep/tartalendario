import { Router } from 'express';
import { EventStatus } from '@prisma/client';
import { z } from 'zod';
import { ACTIVE_PERFORMANCE_STATUSES } from '../lib/conflicts.js';
import { badRequest, notFound, parseBody, parseQuery } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { MAX_DURATION_MS, romeDateOf, zInstant } from '../lib/time.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { performanceInclude } from './performances.js';

export const eventsRouter = Router();
eventsRouter.use('/events', requireAuth, requireRole('ADMIN', 'STAFF'));

const EventBaseSchema = z.object({
  titolo: z.string().trim().min(1, 'Titolo obbligatorio').max(200),
  inizio: zInstant,
  fine: zInstant,
  stato: z.enum(EventStatus).optional(), // default BOZZA (schema Prisma)
  note: z.string().trim().max(5000).nullish(),
});

const ListQuerySchema = z.object({
  from: zInstant.optional(),
  to: zInstant.optional(),
  stato: z.enum(EventStatus).optional(),
});

function assertValidRange(inizio: Date, fine: Date) {
  if (fine <= inizio) throw badRequest("L'ora di fine deve essere successiva all'ora di inizio");
  if (fine.getTime() - inizio.getTime() > MAX_DURATION_MS) {
    throw badRequest('Una serata non può durare più di 24 ore');
  }
}

eventsRouter.get('/events', async (req, res) => {
  const { from, to, stato } = parseQuery(req, ListQuerySchema);
  const events = await prisma.event.findMany({
    where: {
      stato,
      // Serate che intersecano l'intervallo richiesto.
      fine: from ? { gt: from } : undefined,
      inizio: to ? { lt: to } : undefined,
    },
    include: { _count: { select: { performances: true } } },
    orderBy: { inizio: 'asc' },
  });
  res.json({ events });
});

eventsRouter.get('/events/:id', async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { performances: { include: performanceInclude, orderBy: { inizio: 'asc' } } },
  });
  if (!event) throw notFound('Serata non trovata');
  res.json({ event });
});

eventsRouter.post('/events', async (req, res) => {
  const data = parseBody(req, EventBaseSchema);
  assertValidRange(data.inizio, data.fine);
  const event = await prisma.event.create({ data: { ...data, data: romeDateOf(data.inizio) } });
  res.status(201).json({ event });
});

eventsRouter.patch('/events/:id', async (req, res) => {
  const patch = parseBody(req, EventBaseSchema.partial());
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) throw notFound('Serata non trovata');

  const inizio = patch.inizio ?? existing.inizio;
  const fine = patch.fine ?? existing.fine;
  assertValidRange(inizio, fine);

  const event = await prisma.$transaction(async (tx) => {
    const updated = await tx.event.update({
      where: { id: existing.id },
      data: { ...patch, data: romeDateOf(inizio) },
    });
    // Annullare una serata annulla anche i suoi slot ancora attivi.
    if (patch.stato === 'ANNULLATO' && existing.stato !== 'ANNULLATO') {
      await tx.performance.updateMany({
        where: { eventId: existing.id, stato: { in: ACTIVE_PERFORMANCE_STATUSES } },
        data: { stato: 'ANNULLATO' },
      });
    }
    return updated;
  });
  res.json({ event });
});

eventsRouter.delete('/events/:id', async (req, res) => {
  await prisma.event.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
