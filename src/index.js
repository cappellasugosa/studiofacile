const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_CHARS = 120000;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const buckets = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

function clientKey(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

function rateLimited(request) {
  const now = Date.now();
  const key = clientKey(request);
  const old = buckets.get(key);
  if (!old || now - old.start >= WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    return false;
  }
  old.count += 1;
  return old.count > MAX_REQUESTS_PER_WINDOW;
}

function toBase64(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function gemini(parts, env, generationConfig = { temperature: 0.35 }) {
  if (!env.GEMINI_API_KEY) throw new Error("AI non configurata: manca GEMINI_API_KEY nelle variabili segrete di Cloudflare.");
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig })
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || "Errore Gemini");
  return d.candidates?.[0]?.content?.parts?.map(x => x.text || "").join("") || "Nessuna risposta.";
}

async function materialFromForm(request) {
  const form = await request.formData();
  const text = String(form.get("text") || "");
  const file = form.get("file");
  if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) throw new Error("File troppo grande. Massimo 10 MB.");
    const name = String(file.name || "").toLowerCase();
    const type = String(file.type || "");
    if (type === "text/plain" || name.endsWith(".txt")) {
      return { form, text: (await file.text()).slice(0, MAX_TEXT_CHARS) };
    }
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      return { form, pdf: { mimeType: "application/pdf", data: toBase64(await file.arrayBuffer()) } };
    }
    throw new Error("Formato non supportato. Usa TXT o PDF.");
  }
  return { form, text: text.slice(0, MAX_TEXT_CHARS) };
}

async function summarize(request, env) {
  const { form, text, pdf } = await materialFromForm(request);
  const level = String(form.get("level") || "scuola superiore");
  if (!text?.trim() && !pdf) throw new Error("Inserisci un testo o carica un file TXT/PDF.");
  const instruction = `Sei StudioFacile, tutor scolastico italiano. Studente: ${level}.
Analizza SOLO il materiale fornito. Non inventare dati.
Restituisci:
## RIASSUNTO
## SPIEGAZIONE SEMPLICE
## CONCETTI CHIAVE
## COSA MEMORIZZARE
## 5 DOMANDE DI RIPASSO`;
  const parts = [{ text: instruction }];
  if (pdf) parts.push({ inlineData: pdf });
  else parts.push({ text: `Materiale:\n${text}` });
  return json({ answer: await gemini(parts, env) });
}

async function explain(request, env) {
  const body = await request.json();
  const topic = String(body.topic || "").trim();
  if (!topic) throw new Error("Scrivi un argomento.");
  const answer = await gemini([{ text: `Sei un tutor per studenti delle superiori. Spiega in italiano: ${topic}
Usa linguaggio semplice, esempi, passaggi numerati e termina con "In breve" in 5 punti.` }], env);
  return json({ answer });
}

async function quiz(request, env) {
  const { form, text, pdf } = await materialFromForm(request);
  const n = Math.min(20, Math.max(3, Number(form.get("n")) || 10));
  const diff = String(form.get("difficulty") || "media");
  if (!text?.trim() && !pdf) throw new Error("Inserisci un testo o carica un file TXT/PDF.");
  const instruction = `Crea un quiz scolastico in italiano usando ESCLUSIVAMENTE questo materiale.
${n} domande, difficoltà ${diff}. Quattro risposte per domanda.
Rispondi SOLO JSON valido: {"title":"...","questions":[{"question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}]}
correct deve essere l'indice 0-3 della risposta corretta.`;
  const parts = [{ text: instruction }];
  if (pdf) parts.push({ inlineData: pdf });
  else parts.push({ text: `Materiale:\n${text}` });
  const raw = await gemini(parts, env, { temperature: 0.2, responseMimeType: "application/json" });
  const clean = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { return json(JSON.parse(clean)); }
  catch { throw new Error("Gemini ha restituito un formato quiz non valido. Riprova."); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) {
        if (request.method !== "POST") return json({ error: "Metodo non consentito." }, 405);
        if (rateLimited(request)) return json({ error: "Troppi tentativi. Aspetta un minuto e riprova." }, 429);
        if (url.pathname === "/api/summarize") return await summarize(request, env);
        if (url.pathname === "/api/explain") return await explain(request, env);
        if (url.pathname === "/api/quiz") return await quiz(request, env);
        return json({ error: "Endpoint non trovato." }, 404);
      }
      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: e?.message || "Errore interno." }, 500);
    }
  }
};
