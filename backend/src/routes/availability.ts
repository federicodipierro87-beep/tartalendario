import { Router } from 'express';
import { ArtistType } from '@prisma/client';
import { z } from 'zod';
import { parseQuery } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { dateOnlyToDate, zDateOnly } from '../lib/time.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

/** Consultazione delle disponibilità di tutti gli artisti (ADMIN/STAFF). */
export const availabilityRouter = Router();

const QuerySchema = z.object({
  from: zDateOnly.optional(),
  to: zDateOnly.optional(),
  artistId: z.string().optional(),
  tipo: z.enum(ArtistType).optional(),
});

availabilityRouter.get('/availability', requireAuth, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const { from, to, artistId, tipo } = parseQuery(req, QuerySchema);
  const availabilities = await prisma.availability.findMany({
    where: {
      artistId,
      artist: tipo ? { tipo } : undefined,
      data: { gte: from ? dateOnlyToDate(from) : undefined, lte: to ? dateOnlyToDate(to) : undefined },
    },
    include: { artist: { select: { id: true, nomeArte: true, tipo: true } } },
    orderBy: [{ data: 'asc' }, { artist: { nomeArte: 'asc' } }],
  });
  res.json({ availabilities });
});
