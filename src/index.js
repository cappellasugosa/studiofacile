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

function extractInteractionText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const outputs = Array.isArray(data?.outputs) ? data.outputs : [];
  for (let i = outputs.length - 1; i >= 0; i--) {
    const output = outputs[i];
    if (typeof output?.text === "string" && output.text.trim()) return output.text;
    if (Array.isArray(output?.content)) {
      const text = output.content.map(x => x?.text || "").join("").trim();
      if (text) return text;
    }
  }

  const steps = Array.isArray(data?.steps) ? data.steps : [];
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (Array.isArray(step?.content)) {
      const text = step.content.map(x => x?.text || "").join("").trim();
      if (text) return text;
    }
  }

  return "Nessuna risposta.";
}

async function gemini(input, env, responseFormat = null, preferredModels = []) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("AI non configurata: manca GEMINI_API_KEY nelle variabili segrete di Cloudflare.");
  }

  const configured = String(env.GEMINI_MODELS || "gemini-3.6-flash,gemini-2.5-flash-lite,gemini-2.5-flash")
    .split(",").map(x => x.trim()).filter(Boolean);
  const models = [...new Set([...(preferredModels || []), ...configured])];
  let lastError = "Gemini non disponibile.";
  let sawQuota = false;
  let sawBusy = false;

  for (const model of models) {
    const payload = { model, input };
    if (responseFormat) payload.response_format = responseFormat;

    let r;
    try {
      r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY
        },
        body: JSON.stringify(payload)
      });
    } catch {
      lastError = `Impossibile raggiungere ${model}.`;
      sawBusy = true;
      continue;
    }

    let d = {};
    try { d = await r.json(); } catch {}

    if (r.ok) {
      return { text: extractInteractionText(d), model };
    }

    const msg = d?.error?.message || `Errore ${r.status} su ${model}`;
    lastError = msg;

    // Se il modello ha esaurito la quota, è sotto carico o non è disponibile,
    // proviamo automaticamente il modello gratuito successivo.
    if (r.status === 429 || /quota|rate.?limit|too many requests|resource exhausted/i.test(msg)) {
      sawQuota = true;
      continue;
    }
    if (r.status === 503 || /high demand|unavailable|overloaded|temporarily/i.test(msg)) {
      sawBusy = true;
      continue;
    }
    if (r.status === 404 || /not found|not available|unsupported model|model.*(available|exist)/i.test(msg)) {
      continue;
    }

    // Errori non legati alla disponibilità del modello: non ha senso provarne altri.
    throw new Error(msg);
  }

  if (sawQuota && sawBusy) {
    throw new Error("I modelli AI gratuiti sono momentaneamente sotto carico o hanno raggiunto la quota. Riprova tra poco.");
  }
  if (sawQuota) {
    throw new Error("Hai raggiunto temporaneamente la quota gratuita disponibile per i modelli AI. StudioFacile ha provato automaticamente più modelli gratuiti. Riprova quando la quota sarà nuovamente disponibile.");
  }
  if (sawBusy) {
    throw new Error("I modelli AI gratuiti sono momentaneamente sotto forte richiesta. StudioFacile ha provato automaticamente più modelli. Riprova tra poco.");
  }
  throw new Error(lastError);
}

function aiResult(result) {
  return { answer: result.text, model: result.model };
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
      return {
        form,
        pdf: {
          type: "document",
          data: toBase64(await file.arrayBuffer()),
          mime_type: "application/pdf"
        }
      };
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

  const input = pdf
    ? [{ type: "text", text: instruction }, pdf]
    : [{ type: "text", text: `${instruction}\n\nMateriale:\n${text}` }];

  const result = await gemini(input, env, null, ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  return json(aiResult(result));
}

async function explain(request, env) {
  const body = await request.json();
  const topic = String(body.topic || "").trim();
  if (!topic) throw new Error("Scrivi un argomento.");

  const result = await gemini([{
    type: "text",
    text: `Sei StudioFacile, un tutor scolastico italiano esperto.

L'utente ti ha chiesto di SPIEGARE direttamente questo argomento. L'input dell'utente è: "${topic}".
Se l'input contiene formule come "spiegami X", "mi spieghi X" o "spiegazione di X", considera X come l'argomento e ignora il comando introduttivo.
NON trattare l'input come un testo da riassumere o da analizzare. NON dire che mancano informazioni nel materiale fornito: per questa funzione puoi usare le tue conoscenze.

Obiettivo: far capire davvero l'argomento a uno studente delle superiori.
- Inizia con una definizione semplice e diretta.
- Spiega il concetto passo per passo.
- Usa esempi concreti quando aiutano.
- Se ci sono formule, termini tecnici o passaggi, spiegali.
- Evidenzia gli errori/confusioni più comuni, se pertinenti.
- Concludi con "In breve" e 5 punti fondamentali da ricordare.

Rispondi in italiano, in modo chiaro e utile per studiare.`
  }], env);

  return json(aiResult(result));
}

async function quiz(request, env) {
  const { form, text, pdf } = await materialFromForm(request);
  const n = Math.min(20, Math.max(3, Number(form.get("n")) || 10));
  const diff = String(form.get("difficulty") || "media");
  if (!text?.trim() && !pdf) throw new Error("Inserisci un testo o carica un file TXT/PDF.");

  const shortTopic = !pdf && text.trim().length < 120;
  const instruction = shortTopic
    ? `Crea un quiz scolastico in italiano sull'ARGOMENTO indicato dall'utente, usando le tue conoscenze affidabili. L'argomento è: "${text.trim()}".
${n} domande, difficoltà ${diff}. Quattro risposte per domanda.`
    : `Crea un quiz scolastico in italiano usando ESCLUSIVAMENTE questo materiale.
${n} domande, difficoltà ${diff}. Quattro risposte per domanda.
Restituisci un oggetto JSON con questa struttura:
{"title":"...","questions":[{"question":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}]}
correct deve essere l'indice 0-3 della risposta corretta.`;

  const input = pdf
    ? [{ type: "text", text: instruction }, pdf]
    : [{ type: "text", text: `${instruction}\n\nMateriale:\n${text}` }];

  const schema = {
    type: "text",
    mime_type: "application/json",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: {
                type: "array",
                items: { type: "string" },
                minItems: 4,
                maxItems: 4
              },
              correct: { type: "integer", minimum: 0, maximum: 3 },
              explanation: { type: "string" }
            },
            required: ["question", "options", "correct", "explanation"]
          }
        }
      },
      required: ["title", "questions"]
    }
  };

  const result = await gemini(input, env, schema, ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3.6-flash"]);
  const raw = result.text;
  const clean = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    const data = JSON.parse(clean);
    data.aiModel = result.model;
    return json(data);
  } catch {
    throw new Error("Gemini ha restituito un formato quiz non valido. Riprova.");
  }
}

async function flashcards(request, env) {
  const { form, text, pdf } = await materialFromForm(request);
  const n = Math.min(20, Math.max(3, Number(form.get("n")) || 10));
  if (!text?.trim() && !pdf) throw new Error("Inserisci un argomento o carica un file TXT/PDF.");

  const shortTopic = !pdf && text.trim().length < 120;
  const instruction = shortTopic
    ? `Sei StudioFacile, tutor scolastico italiano. Crea ${n} flashcard in italiano sull'argomento "${text.trim()}" usando conoscenze affidabili. Ogni carta deve avere una domanda chiara e una risposta breve ma completa. Puoi aggiungere un breve approfondimento opzionale.`
    : `Sei StudioFacile, tutor scolastico italiano. Crea ${n} flashcard in italiano usando ESCLUSIVAMENTE il materiale fornito. Ogni carta deve avere una domanda chiara e una risposta breve ma completa. Non inventare informazioni.`;

  const input = pdf
    ? [{ type: "text", text: `${instruction} Restituisci un oggetto JSON con title e cards.` }, pdf]
    : [{ type: "text", text: `${instruction}

Materiale/argomento:
${text}` }];

  const schema = {
    type: "text",
    mime_type: "application/json",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        cards: {
          type: "array",
          minItems: 3,
          maxItems: 20,
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
              extra: { type: "string" }
            },
            required: ["question", "answer", "extra"]
          }
        }
      },
      required: ["title", "cards"]
    }
  };

  const result = await gemini(input, env, schema, ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3.6-flash"]);
  const raw = result.text;
  const clean = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const data = JSON.parse(clean);
    if (!Array.isArray(data.cards) || !data.cards.length) throw new Error();
    data.cards = data.cards.slice(0, n);
    data.aiModel = result.model;
    return json(data);
  } catch {
    throw new Error("Gemini ha restituito un formato flashcard non valido. Riprova.");
  }
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
        if (url.pathname === "/api/flashcards") return await flashcards(request, env);
        return json({ error: "Endpoint non trovato." }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (e) {
      return json({ error: e?.message || "Errore interno." }, 500);
    }
  }
};
