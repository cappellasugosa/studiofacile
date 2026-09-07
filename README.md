# StudioFacile v10 — Multi-provider AI gratuito

StudioFacile v10 assegna un provider diverso alle varie funzioni e usa fallback automatici.

## Routing
- Spiegami questo → Gemini → Groq → OpenRouter
- Riassumi → Gemini → OpenRouter → Groq
- Quiz → Groq → OpenRouter → Gemini
- Flashcard → Groq → OpenRouter → Gemini
- Quiz/Flashcard da PDF → Gemini prima, perché il documento viene passato direttamente al modello.
- Correzione quiz → 0 richieste AI, tutta locale nel browser.

## Provider
- Google Gemini: `GEMINI_API_KEY`
- Groq: `GROQ_API_KEY`
- OpenRouter: `OPENROUTER_API_KEY`

Il codice non contiene chiavi. Le tre chiavi sono opzionali: se un provider non è configurato viene saltato. Per mantenere il progetto a costo zero, usa gli account/piani Free dei provider e non aggiungere credito o billing. I limiti gratuiti dipendono dal provider e possono cambiare.

## Modelli predefiniti
- Gemini: `gemini-3.6-flash`, fallback `gemini-2.5-flash-lite`, `gemini-2.5-flash`
- Groq: `openai/gpt-oss-20b`
- OpenRouter: `openrouter/free`, che instrada verso un modello gratuito disponibile.

## Cloudflare Secrets
In Variables and Secrets aggiungi come **Secret**:
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

Poi salva e fai Deploy. Non mettere mai le chiavi nel frontend o nel repository GitHub.

## Deploy
Sostituisci i file del repository, fai Commit changes e lascia che Cloudflare esegua `npx wrangler deploy`.
