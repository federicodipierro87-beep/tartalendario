# Tartalendario — regole di lavoro

- Nessun ambiente locale (niente DB/server): ogni modifica si verifica dopo il deploy
  (backend su Railway, frontend su Netlify, deploy automatico su push a `main`).
- Prima di ogni commit: `npm run lint` e `npm run build` nella cartella toccata.
- Al termine di ogni step: `git add`, `git commit` (Conventional Commits), `git push` su `main`.
- Mai segreti nel codice: variabili d'ambiente + aggiornare i `.env.example`.
- Configurazioni su Railway/Netlify/GitHub: fermarsi e dare istruzioni passo passo all'utente.
- UI in italiano, fuso orario Europe/Rome; date salvate in UTC.
- DJ e BAND si distinguono solo tramite `Artist.tipo`: niente logiche hardcoded per i DJ.
- Migrazioni Prisma senza DB: generare l'SQL con `prisma migrate diff`.
- Versioni: TypeScript 6.0 (typescript-eslint non supporta ancora TS 7), Prisma 6, ESLint 9.
