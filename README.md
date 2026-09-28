# Tartalendario

Calendario condiviso per gestire le serate della discoteca: artisti (DJ oggi, band domani),
sale, serate, slot, disponibilità e feed iCal.

## Struttura

```
backend/            API REST — Node.js, TypeScript, Express, Prisma, PostgreSQL (deploy: Railway)
frontend/           SPA — React, Vite, TypeScript, FullCalendar (deploy: Netlify)
.github/workflows/  CI: lint + build di backend e frontend a ogni push
netlify.toml        Configurazione Netlify (base = frontend, redirect SPA)
```

`backend` e `frontend` sono pacchetti npm indipendenti, ciascuno con il proprio `package-lock.json`.

## Deploy

Railway e Netlify fanno il deploy automatico a ogni push su `main`.
Non esiste un ambiente locale di riferimento: ogni modifica si verifica dopo il deploy.

### Backend (Railway)

- Root Directory del servizio: `backend`
- Configurazione in `backend/railway.json` (in Railway: Settings → Config-as-code → `/backend/railway.json`)
- All'avvio vengono eseguite le migrazioni (`prisma migrate deploy`) e il seed dell'utente admin
- Health check: `GET /health`

| Variabile | Descrizione |
|---|---|
| `DATABASE_URL` | Connessione PostgreSQL (riferimento al servizio Postgres di Railway) |
| `JWT_SECRET` | Segreto per firmare i token JWT |
| `CORS_ORIGIN` | URL del sito Netlify (più valori separati da virgola) |
| `PORT` | Porta HTTP (impostata da Railway) |
| `PUBLIC_API_URL` | URL pubblico del backend, usato per i link iCal |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOME` | Utente ADMIN creato al primo avvio |

### Frontend (Netlify)

| Variabile | Descrizione |
|---|---|
| `VITE_API_URL` | URL pubblico del backend Railway (senza slash finale) |

Vedi `backend/.env.example` e `frontend/.env.example`.

## Sviluppo locale (opzionale)

```bash
cd backend && npm install && npm run build && npm run lint
cd frontend && npm install && npm run build && npm run lint
```

## Convenzioni

- Commit in formato Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`)
- Orari salvati in UTC, visualizzati in `Europe/Rome`; le serate possono attraversare la mezzanotte
- Il tipo di artista (`DJ` | `BAND`) è sempre un dato, mai una logica hardcoded
