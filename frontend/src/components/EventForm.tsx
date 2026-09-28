import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../lib/api';
import { EVENT_STATUSES, eventStatusLabel } from '../lib/labels';
import { formatRange, isoToRomeParts, romeToIso, todayRome } from '../lib/time';
import type { EventItem, EventStatus } from '../lib/types';
import { splitLineup, type LineupValue } from '../lib/lineup';
import { LineupPicker } from './LineupPicker';

interface Props {
  event?: EventItem;
  defaultDate?: string;
  onSaved: (event: EventItem) => void;
  onCancel: () => void;
}

/**
 * Form serata. L'utente inserisce data e orari in Europe/Rome; se l'ora di fine
 * non è successiva a quella di inizio, la fine cade il giorno dopo (es. 23:00 → 05:00).
 */
export function EventForm({ event, defaultDate, onSaved, onCancel }: Props) {
  const start = event ? isoToRomeParts(event.inizio) : null;
  const end = event ? isoToRomeParts(event.fine) : null;

  const [titolo, setTitolo] = useState(event?.titolo ?? '');
  const [data, setData] = useState(start?.date ?? defaultDate ?? todayRome());
  const [oraInizio, setOraInizio] = useState(start?.time ?? '23:00');
  const [oraFine, setOraFine] = useState(end?.time ?? '05:00');
  const [stato, setStato] = useState<EventStatus>(event?.stato ?? 'PUBBLICATO');
  const [note, setNote] = useState(event?.note ?? '');
  const [lineup, setLineup] = useState<LineupValue>({ artistIds: [], roomId: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inizio = data && oraInizio ? romeToIso(data, oraInizio) : null;
  const fine = inizio && oraFine ? romeToIso(data, oraFine, inizio) : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inizio || !fine) return;
    setBusy(true);
    setError(null);
    try {
      const body = { titolo, inizio, fine, stato, note: note || null };
      const r = event
        ? await api.patch<{ event: EventItem }>(`/events/${event.id}`, body)
        : await api.post<{ event: EventItem }>('/events', { ...body, slots: splitLineup(lineup, inizio, fine) });
      onSaved(r.event);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        Titolo
        <input value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="es. Sabato Notte" required />
      </label>
      {!event && <LineupPicker value={lineup} onChange={setLineup} inizio={inizio} fine={fine} />}
      <div className="form-row">
        <label>
          Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
        <label>
          Inizio
          <input type="time" value={oraInizio} onChange={(e) => setOraInizio(e.target.value)} required />
        </label>
        <label>
          Fine
          <input type="time" value={oraFine} onChange={(e) => setOraFine(e.target.value)} required />
        </label>
      </div>
      {inizio && fine && <div className="hint">Orario: {formatRange(inizio, fine)}</div>}
      <label>
        Stato
        <select value={stato} onChange={(e) => setStato(e.target.value as EventStatus)}>
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {eventStatusLabel[s]}
            </option>
          ))}
        </select>
      </label>
      {event && stato === 'ANNULLATO' && event.stato !== 'ANNULLATO' && (
        <div className="alert alert-error">Annullando la serata verranno annullati anche tutti i suoi slot attivi.</div>
      )}
      <label>
        Note
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annulla
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {event ? 'Salva' : 'Crea serata'}
        </button>
      </div>
    </form>
  );
}
