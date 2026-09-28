// Etichette e colori per i valori enumerati. Nessuna logica specifica per DJ o BAND:
// il tipo di artista è sempre un dato da mostrare o filtrare.
import type { ArtistType, EventStatus, PerformanceStatus, Role } from './types';

export const ARTIST_TYPES: ArtistType[] = ['DJ', 'BAND'];
export const artistTypeLabel: Record<ArtistType, string> = { DJ: 'DJ', BAND: 'Band' };

export const ROLES: Role[] = ['ADMIN', 'STAFF', 'ARTIST'];
export const roleLabel: Record<Role, string> = { ADMIN: 'Amministratore', STAFF: 'Staff', ARTIST: 'Artista' };

export const EVENT_STATUSES: EventStatus[] = ['BOZZA', 'PUBBLICATO', 'ANNULLATO'];
export const eventStatusLabel: Record<EventStatus, string> = {
  BOZZA: 'Bozza',
  PUBBLICATO: 'Pubblicata',
  ANNULLATO: 'Annullata',
};

export const PERFORMANCE_STATUSES: PerformanceStatus[] = ['PROPOSTO', 'CONFERMATO', 'RIFIUTATO', 'ANNULLATO'];
export const performanceStatusLabel: Record<PerformanceStatus, string> = {
  PROPOSTO: 'Proposto',
  CONFERMATO: 'Confermato',
  RIFIUTATO: 'Rifiutato',
  ANNULLATO: 'Annullato',
};

/** Colori per stato dello slot (sfondo, testo), usati in calendario e badge. */
export const performanceStatusColor: Record<PerformanceStatus, { bg: string; fg: string }> = {
  PROPOSTO: { bg: '#f59e0b', fg: '#1f1300' },
  CONFERMATO: { bg: '#16a34a', fg: '#ffffff' },
  RIFIUTATO: { bg: '#dc2626', fg: '#ffffff' },
  ANNULLATO: { bg: '#6b7280', fg: '#ffffff' },
};

export const eventStatusColor: Record<EventStatus, { bg: string; fg: string }> = {
  BOZZA: { bg: '#a78bfa', fg: '#1e0a3c' },
  PUBBLICATO: { bg: '#6d28d9', fg: '#ffffff' },
  ANNULLATO: { bg: '#6b7280', fg: '#ffffff' },
};
