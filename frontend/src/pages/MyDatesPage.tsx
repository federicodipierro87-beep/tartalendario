import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { IcalLink } from '../components/IcalLink';
import { Modal } from '../components/Modal';
import { PerformanceStatusBadge } from '../components/StatusBadge';
import { AvailabilityCalendar } from './MyAvailabilityPage';
import { api, errorMessage } from '../lib/api';
import { formatDateOnly, formatRange } from '../lib/time';
import type { Artist, Performance } from '../lib/types';
import { useAsync } from '../lib/useAsync';

type Tab = 'da-confermare' | 'prossime' | 'calendario' | 'passate';

export function MyDatesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('da-confermare');
  const [responding, setResponding] = useState<{ p: Performance; risposta: 'CONFERMATO' | 'RIFIUTATO' } | null>(null);

  // Tutti gli slot dell'artista: il backend filtra automaticamente per l'utente ARTIST.
  const { data, error, reload } = useAsync(() =>
    api
      .get<{ performances: Performance[] }>('/performances')
      .then((r) => ({ performances: r.performances, loadedAt: Date.now() })),
  );

  const groups = useMemo(() => {
    const now = data?.loadedAt ?? 0;
    const isPast = (p: Performance) => new Date(p.fine).getTime() < now;
    const all = data?.performances ?? [];
    const future = all.filter((p) => !isPast(p));
    return {
      'da-confermare': future.filter((p) => p.stato === 'PROPOSTO'),
      prossime: future.filter((p) => p.stato === 'CONFERMATO' || p.stato === 'PROPOSTO'),
      passate: all.filter(isPast).reverse(),
    };
  }, [data]);

  if (!user?.artistId) {
    return (
      <div className="page narrow">
        <h1>Le mie date</h1>
        <div className="alert alert-error">Il tuo utente non è collegato a un profilo artista. Contatta lo staff.</div>
      </div>
    );
  }

  const pending = groups['da-confermare'].length;

  return (
    <div className="page">
      <h1>Le mie date</h1>
      <div className="segmented">
        <button className={tab === 'da-confermare' ? 'active' : ''} onClick={() => setTab('da-confermare')}>
          Da confermare{pending > 0 ? ` (${pending})` : ''}
        </button>
        <button className={tab === 'prossime' ? 'active' : ''} onClick={() => setTab('prossime')}>
          Prossime
        </button>
        <button className={tab === 'calendario' ? 'active' : ''} onClick={() => setTab('calendario')}>
          Calendario
        </button>
        <button className={tab === 'passate' ? 'active' : ''} onClick={() => setTab('passate')}>
          Passate
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {!data && !error && <div className="muted">Caricamento…</div>}

      {data && tab === 'calendario' && (
        <>
          <AvailabilityCalendar />
          <MyIcalCard />
        </>
      )}

      {data && tab !== 'calendario' && (
        <SlotList
          slots={groups[tab]}
          emptyText={
            tab === 'da-confermare'
              ? 'Nessuna proposta in attesa di risposta.'
              : tab === 'prossime'
                ? 'Nessuna data in programma.'
                : 'Nessuna data passata.'
          }
          onRespond={(p, risposta) => setResponding({ p, risposta })}
        />
      )}

      {responding && (
        <RespondModal
          performance={responding.p}
          risposta={responding.risposta}
          onClose={() => setResponding(null)}
          onDone={() => {
            setResponding(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function SlotList({
  slots,
  emptyText,
  onRespond,
}: {
  slots: Performance[];
  emptyText: string;
  onRespond: (p: Performance, risposta: 'CONFERMATO' | 'RIFIUTATO') => void;
}) {
  if (slots.length === 0) return <div className="card empty">{emptyText}</div>;
  return (
    <ul className="card list slot-list">
      {slots.map((p) => (
        <li key={p.id}>
          <div className="grow">
            <strong>{p.event.titolo}</strong>
            <div className="muted">
              {formatDateOnly(p.event.data)} · {formatRange(p.inizio, p.fine)} · {p.room.nome}
            </div>
            {p.compenso && (
              <div className="small">Compenso: € {Number(p.compenso).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</div>
            )}
            {p.note && <div className="small muted pre">{p.note}</div>}
          </div>
          <PerformanceStatusBadge stato={p.stato} />
          {p.stato === 'PROPOSTO' && (
            <div className="form-actions">
              <button className="btn btn-danger-ghost" onClick={() => onRespond(p, 'RIFIUTATO')}>
                Rifiuta
              </button>
              <button className="btn btn-primary" onClick={() => onRespond(p, 'CONFERMATO')}>
                Conferma
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function RespondModal({
  performance,
  risposta,
  onClose,
  onDone,
}: {
  performance: Performance;
  risposta: 'CONFERMATO' | 'RIFIUTATO';
  onClose: () => void;
  onDone: () => void;
}) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/me/performances/${performance.id}/respond`, { risposta, note: note.trim() || undefined });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const conferma = risposta === 'CONFERMATO';
  return (
    <Modal title={conferma ? 'Conferma data' : 'Rifiuta data'} onClose={onClose}>
      <div className="form">
        <div className="hint">
          {performance.event.titolo} · {formatDateOnly(performance.event.data)} ·{' '}
          {formatRange(performance.inizio, performance.fine)} · {performance.room.nome}
        </div>
        <label>
          Messaggio per lo staff (facoltativo)
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Annulla
          </button>
          <button className={`btn ${conferma ? 'btn-primary' : 'btn-danger'}`} onClick={submit} disabled={busy}>
            {conferma ? 'Conferma' : 'Rifiuta'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MyIcalCard() {
  const { data, error } = useAsync(() => api.get<{ artist: Artist }>('/me/artist').then((r) => r.artist));
  return (
    <section className="card">
      <h2>Sincronizza con il tuo calendario</h2>
      <p className="muted">Aggiungi le tue date a Google Calendar, Apple Calendar o Outlook: si aggiornano da sole.</p>
      {error && <div className="alert alert-error">{error}</div>}
      {data && <IcalLink token={data.icalToken} regeneratePath="/me/ical-token" />}
    </section>
  );
}
