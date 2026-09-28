import { Router } from 'express';
import { z } from 'zod';
import { conflict, param, parseBody } from '../lib/http.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const roomsRouter = Router();

const RoomSchema = z.object({
  nome: z.string().trim().min(1, 'Nome sala obbligatorio').max(100),
  attiva: z.boolean().optional(),
});

// Le sale servono anche agli artisti per leggere il calendario.
roomsRouter.get('/rooms', requireAuth, async (_req, res) => {
  const rooms = await prisma.room.findMany({ orderBy: { nome: 'asc' } });
  res.json({ rooms });
});

roomsRouter.post('/rooms', requireAuth, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const room = await prisma.room.create({ data: parseBody(req, RoomSchema) });
  res.status(201).json({ room });
});

roomsRouter.patch('/rooms/:id', requireAuth, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const room = await prisma.room.update({
    where: { id: param(req, 'id') },
    data: parseBody(req, RoomSchema.partial()),
  });
  res.json({ room });
});

roomsRouter.delete('/rooms/:id', requireAuth, requireRole('ADMIN', 'STAFF'), async (req, res) => {
  const count = await prisma.performance.count({ where: { roomId: param(req, 'id') } });
  if (count > 0) {
    throw conflict(`Impossibile eliminare: la sala ha ${count} slot in calendario. Disattivala invece.`);
  }
  await prisma.room.delete({ where: { id: param(req, 'id') } });
  res.status(204).end();
});
