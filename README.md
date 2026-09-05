# StudioFacile — Cloudflare Workers

Versione pronta per Cloudflare Workers + Workers Static Assets + Gemini API.

## Deploy da GitHub
1. Carica questi file in un repository GitHub.
2. In Cloudflare: Workers & Pages → Create → Connect to Git → scegli il repository.
3. Usa `npx wrangler deploy` come deploy command se richiesto.
4. In Settings → Variables and Secrets aggiungi `GEMINI_API_KEY` come Secret.
5. Lascia `GEMINI_MODEL=gemini-2.5-flash`.

Il frontend viene servito da `public/` e le API `/api/*` vengono gestite dal Worker.
PDF e TXT sono supportati fino a 10 MB. È incluso un semplice rate limit per IP; per un lancio pubblico conviene aggiungere Durable Objects/KV o un rate limiter più robusto.
