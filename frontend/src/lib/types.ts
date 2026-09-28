// Tipi condivisi con le risposte dell'API backend.

export type Role = 'ADMIN' | 'STAFF' | 'ARTIST';
export type ArtistType = 'DJ' | 'BAND';
export type EventStatus = 'BOZZA' | 'PUBBLICATO' | 'ANNULLATO';
export type PerformanceStatus = 'PROPOSTO' | 'CONFERMATO' | 'RIFIUTATO' | 'ANNULLATO';

export interface ArtistSummary {
  id: string;
  nomeArte: string;
  tipo: ArtistType;
}

export interface User {
  id: string;
  email: string;
  nome: string;
  ruolo: Role;
  artistId: string | null;
  artist: ArtistSummary | null;
}

export interface BandProfile {
  id: string;
  numeroMembri: number | null;
  backline: string | null;
  technicalRider: unknown;
}

export interface Artist extends ArtistSummary {
  email: string | null;
  telefono: string | null;
  genereMusicale: string | null;
  note: string | null;
  attivo: boolean;
  icalToken: string;
  createdAt: string;
  bandProfile: BandProfile | null;
  user: { id: string; email: string; nome: string } | null;
}

export interface Room {
  id: string;
  nome: string;
  attiva: boolean;
}

export interface EventItem {
  id: string;
  titolo: string;
  data: string;
  inizio: string;
  fine: string;
  stato: EventStatus;
  note: string | null;
  _count?: { performances: number };
  performances?: Performance[];
}

export interface Performance {
  id: string;
  eventId: string;
  artistId: string;
  roomId: string;
  inizio: string;
  fine: string;
  stato: PerformanceStatus;
  compenso: string | null;
  note: string | null;
  artist: ArtistSummary & { genereMusicale: string | null };
  room: { id: string; nome: string };
  event: Pick<EventItem, 'id' | 'titolo' | 'stato' | 'inizio' | 'fine' | 'data'>;
}

export interface Availability {
  id: string;
  artistId: string;
  data: string;
  disponibile: boolean;
  note: string | null;
  artist?: ArtistSummary;
}
