# StudioFacile v8 — Cloudflare Workers + Gemini 3.6 Flash

Versione completa per il deploy su Cloudflare Workers.

## Funzioni
- **Riassumi e spiega**: testo o PDF/TXT, livello scolastico.
- **Spiegami questo**: l'utente inserisce un argomento e l'AI lo spiega usando le proprie conoscenze.
- **Genera quiz**: da appunti/file oppure direttamente da un argomento.
- **Correzione quiz completa**: confronto con la risposta corretta, segnalazione corretta/sbagliata/non risposta, risposta corretta, spiegazione e voto finale.
- **Pomodoro** da 25 minuti.
- **Calcolo media**.
- Textarea fisse con espansione automatica e scroll interno oltre 720px.
- Gemini 3.6 Flash tramite Interactions API.
- API key solo lato Cloudflare Secret.
- Limite semplice di 8 richieste/minuto per IP.

## Deploy
1. Sostituisci i file del repository GitHub con quelli di questa versione.
2. Commit/push.
3. Cloudflare eseguirà il deploy con `npx wrangler deploy`.
4. Mantieni `GEMINI_API_KEY` nelle Variables and Secrets come **Secret**.
5. Non inserire la chiave nel frontend.

## Configurazione
`wrangler.jsonc` usa:
- `GEMINI_MODEL = gemini-3.6-flash`
- static assets in `./public`
- Worker entrypoint `src/index.js`

## Nota quiz
La correzione è locale nel browser dopo la generazione: le risposte corrette arrivano insieme al quiz dal backend e il browser confronta l'indice selezionato con `correct`. Non viene fatta una seconda chiamata AI per correggere il quiz.


## Novità v8
- Flashcard AI con carte interattive domanda/risposta.
- Correzione quiz completamente locale: nessuna chiamata Gemini per correggere.
- Feedback per ogni domanda e risposta corretta mostrata negli errori.
- Layout quiz allineato a sinistra e ottimizzato per desktop/mobile.
- Gestione più chiara degli errori di quota Gemini (429) e alta richiesta (503).


## v9 — Multi-modello gratuito
La v9 usa una selezione automatica di modelli Gemini disponibili nel Free Tier. Ordine predefinito:
- Gemini 3.6 Flash per spiegazioni/riassunti
- Gemini 2.5 Flash-Lite per quiz/flashcard
- Gemini 2.5 Flash come ulteriore fallback

Se un modello restituisce quota esaurita, rate limit, alta richiesta o non è disponibile, il Worker prova automaticamente il modello successivo. La correzione dei quiz resta locale e non consuma chiamate AI.

La variabile Cloudflare `GEMINI_MODELS` può essere modificata solo se vuoi cambiare l'ordine dei modelli; non serve modificare `GEMINI_API_KEY`.
