import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../lib/api';
import type { Room } from '../lib/types';
import { useAsync } from '../lib/useAsync';

export function RoomsPage() {
  const { data, error, loading, reload } = useAsync(() => api.get<{ rooms: Room[] }>('/rooms').then((r) => r.rooms));
  const [nome, setNome] = useState('');
  const [editing, setEditing] = useState<{ id: string; nome: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api.post('/rooms', { nome });
      setNome('');
    });
  }

  function onRename(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    run(async () => {
      await api.patch(`/rooms/${editing.id}`, { nome: editing.nome });
      setEditing(null);
    });
  }

  return (
    <div className="page narrow">
      <h1>Sale</h1>
      <p className="muted">Sale e palchi del locale. Una sala disattivata non accetta nuovi slot.</p>

      <form className="card inline-form" onSubmit={onCreate}>
        <input placeholder="Nome nuova sala (es. Sala principale)" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <button className="btn btn-primary">Aggiungi</button>
      </form>

      {(error || actionError) && <div className="alert alert-error">{error ?? actionError}</div>}
      {loading && !data && <div className="muted">Caricamento…</div>}

      {data && data.length === 0 && <div className="card empty">Nessuna sala. Aggiungine una per iniziare.</div>}
      {data && data.length > 0 && (
        <ul className="card list">
          {data.map((room) => (
            <li key={room.id} className={room.attiva ? '' : 'inactive'}>
              {editing?.id === room.id ? (
                <form className="inline-form grow" onSubmit={onRename}>
                  <input
                    autoFocus
                    value={editing.nome}
                    onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                    required
                  />
                  <button className="btn btn-primary">Salva</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                    Annulla
                  </button>
                </form>
              ) : (
                <>
                  <span className="grow">
                    {room.nome} {!room.attiva && <span className="badge">disattivata</span>}
                  </span>
                  <button className="btn btn-ghost" onClick={() => setEditing({ id: room.id, nome: room.nome })}>
                    Rinomina
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => run(() => api.patch(`/rooms/${room.id}`, { attiva: !room.attiva }))}
                  >
                    {room.attiva ? 'Disattiva' : 'Riattiva'}
                  </button>
                  <button
                    className="btn btn-danger-ghost"
                    onClick={() =>
                      confirm(`Eliminare la sala "${room.nome}"?`) && run(() => api.delete(`/rooms/${room.id}`))
                    }
                  >
                    Elimina
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
