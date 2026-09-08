
const GA_ID="G-GECV8MZBBL";
const CONSENT_KEY="studiofacile-consent-v15";

function gaEvent(name,params={}){
  if(typeof window.gtag==="function") window.gtag("event",name,params);
}

function ensureGtagQueue(){
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
}

function setGoogleConsent(granted){
  ensureGtagQueue();
  window.gtag("consent","update",{
    analytics_storage:granted?"granted":"denied",
    ad_storage:"denied",
    ad_user_data:"denied",
    ad_personalization:"denied"
  });
}

function loadAnalytics(){
  if(window.__sfAnalyticsLoaded) return;
  window.__sfAnalyticsLoaded=true;
  ensureGtagQueue();
  window.gtag("js",new Date());
  window.gtag("config",GA_ID,{anonymize_ip:true});
  const s=document.createElement("script");
  s.async=true;
  s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(GA_ID);
  s.onerror=()=>{window.__sfAnalyticsBlocked=true};
  document.head.appendChild(s);
}

function saveConsent(value){
  try{localStorage.setItem(CONSENT_KEY,value)}catch(e){}
}
function readConsent(){
  try{return localStorage.getItem(CONSENT_KEY)}catch(e){return null}
}

function buildConsentUI(){
  const host=document.getElementById("sfConsent");
  const prefs=document.getElementById("sfPrefsPanel");
  if(!host||!prefs)return;
  host.innerHTML=`<div class="sf-consent-box" role="dialog" aria-label="Scelte statistiche"><div><strong>Privacy e statistiche</strong><p>Puoi permettere a StudioFacile di usare statistiche anonime per capire quali strumenti vengono utilizzati.</p></div><div class="sf-consent-actions"><button id="sfNo" type="button">Solo necessari</button><button id="sfYes" type="button">Accetta statistiche</button></div></div>`;
  prefs.innerHTML=`<div class="sf-prefs-box" role="dialog" aria-modal="true" aria-label="Privacy e statistiche"><button id="sfPrefsClose" type="button" class="sf-close" aria-label="Chiudi">×</button><h3>Privacy e statistiche</h3><p>Scegli se permettere a StudioFacile di usare Google Analytics per misurare visite e utilizzo degli strumenti.</p><div class="sf-consent-actions"><button id="sfPrefsNo" type="button">Solo necessari</button><button id="sfPrefsYes" type="button">Accetta statistiche</button></div></div>`;
  host.addEventListener("click",e=>{if(e.target.id==="sfYes")acceptAnalytics();if(e.target.id==="sfNo")denyAnalytics()});
  prefs.addEventListener("click",e=>{if(e.target.id==="sfPrefsYes")acceptAnalytics();if(e.target.id==="sfPrefsNo")denyAnalytics();if(e.target.id==="sfPrefsClose"||e.target===prefs)closePrefs()});
  document.getElementById("sfPrefs")?.addEventListener("click",openPrefs);
}
function showConsent(){const el=document.getElementById("sfConsent");if(el)el.hidden=false}
function hideConsent(){const el=document.getElementById("sfConsent");if(el)el.hidden=true}
function openPrefs(){const el=document.getElementById("sfPrefsPanel");if(el){el.hidden=false;document.body.classList.add("sf-lock")}}
function closePrefs(){const el=document.getElementById("sfPrefsPanel");if(el){el.hidden=true;document.body.classList.remove("sf-lock")}}
function acceptAnalytics(){
  saveConsent("granted");
  ensureGtagQueue();
  setGoogleConsent(true);
  loadAnalytics();
  hideConsent();
  closePrefs();
}
function denyAnalytics(){
  saveConsent("denied");
  if(typeof window.gtag==="function")setGoogleConsent(false);
  hideConsent();
  closePrefs();
}
function setupAnalyticsConsent(){
  ensureGtagQueue();
  // Basic Consent Mode: no Google tag is loaded until the visitor accepts.
  window.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",wait_for_update:500});
  buildConsentUI();
  const c=readConsent();
  if(c==="granted"){
    setGoogleConsent(true);
    loadAnalytics();
  }else if(c!=="denied"){
    showConsent();
  }
}

const TOOL_ICONS={
 summary:'<svg viewBox="0 0 24 24"><path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
 pdf:'<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h5"/></svg>',
 explain:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M9.5 9a2.7 2.7 0 1 1 4.7 1.8c-1.2 1.2-2.2 1.6-2.2 3"/><path d="M12 17h.01"/></svg>',
 quiz:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="m8 12 2.3 2.3L16 8.7"/></svg>',
 flashcards:'<svg viewBox="0 0 24 24"><rect x="5" y="6" width="14" height="13" rx="2"/><path d="M8 3h9a2 2 0 0 1 2 2v10"/></svg>',
 pomo:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7"/><path d="M12 13V9M9 3h6M15 5l2-2"/></svg>',
 calc:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2"/></svg>'
};
function toolHeader(key,title,kicker,desc){return `<div class="tool-modal-head"><div class="tool-modal-icon">${TOOL_ICONS[key]||TOOL_ICONS.summary}</div><div><div class="tool-modal-kicker">${kicker}</div><h2>${title}</h2><p>${desc}</p></div></div>`}
function openTool(t){gaEvent("tool_open",{tool:t});modal.classList.remove("hidden");document.body.classList.add("modal-open");if(t==="summary")summaryUI();if(t==="pdf")pdfUI();if(t==="quiz")quizUI();if(t==="explain")explainUI();if(t==="pomo")pomoUI();if(t==="calc")calcUI();if(t==="flashcards")flashcardsUI();setTimeout(setupGrow,0)}
function startExperience(){window.scrollTo({top:0,behavior:"smooth"});openTool("summary")}
function closeTool(){modal.classList.add("hidden");document.body.classList.remove("modal-open");clearInterval(iv);iv=null;pomoRunning=false}
function setupGrow(){document.querySelectorAll("textarea").forEach(x=>{if(x.dataset.growReady)return;x.dataset.growReady="1";x.addEventListener("input",()=>grow(x));grow(x)})}
function grow(x){x.style.height="180px";x.style.height=Math.min(x.scrollHeight,720)+"px";x.style.overflowY=x.scrollHeight>720?"auto":"hidden"}
function fileUI(){return `<label class="file-drop" for="file"><span class="file-drop-icon"><svg viewBox="0 0 24 24"><path d="M12 16V4M8 8l4-4 4 4"/><path d="M5 14v5h14v-5"/></svg></span><span><b>Carica un file</b><small>PDF o TXT · massimo 10 MB</small></span><span class="file-drop-cta">Scegli file</span><input id="file" type="file" accept=".txt,.pdf"></label>`}
function summaryUI(){content.innerHTML=`${toolHeader("summary","AI Assistant","AI TUTOR","Scrivi semplicemente cosa vuoi capire. L’AI può spiegarti un argomento anche senza alcun materiale allegato.")}<div class="form"><textarea id="text" placeholder="Es. Spiegami i logaritmi in modo semplice...

Puoi anche chiedere un esempio, una spiegazione passo passo o chiarire un dubbio."></textarea><div class="form-row"><label class="field"><span>Livello</span><select id="level"><option>scuola superiore</option><option>scuola media</option><option>università</option></select></label></div><button id="summaryBtn" class="form-primary">Spiegami <span>→</span></button><div id="out"></div></div>`;document.getElementById("summaryBtn").addEventListener("click",summary)}
async function summary(){gaEvent("generate_explanation");const raw=document.getElementById("text").value.trim();if(!raw){document.getElementById("out").innerHTML=`<div class="result">Scrivi l’argomento o il dubbio che vuoi capire.</div>`;return}await send("/api/explain",JSON.stringify({topic:raw}),{"Content-Type":"application/json"})}
function pdfUI(){content.innerHTML=`${toolHeader("pdf","PDF / TXT","SPIEGA IL TUO FILE","Carica un PDF o un TXT: l’AI legge il materiale e te lo spiega in modo chiaro e ordinato.")}<div class="form">${fileUI()}<div class="form-row"><label class="field"><span>Livello</span><select id="level"><option>scuola superiore</option><option>scuola media</option><option>università</option></select></label></div><button id="pdfBtn" class="form-primary">Spiegami il file <span>→</span></button><div id="out"></div></div>`;document.getElementById("pdfBtn").addEventListener("click",pdfAnalyze)}
async function pdfAnalyze(){gaEvent("generate_summary");const f=document.getElementById("file")?.files?.[0],out=document.getElementById("out");if(!f){out.innerHTML=`<div class="result">Seleziona un file PDF o TXT.</div>`;return}const fd=new FormData();fd.append("file",f);fd.append("text","");fd.append("level",document.getElementById("level").value);await send("/api/summarize",fd)}
function explainUI(){content.innerHTML=`${toolHeader("explain","Spiegami questo","SPIEGAZIONE AI","Scrivi un argomento e ricevi una spiegazione chiara, graduale e con esempi.")}<div class="form"><textarea id="text" placeholder="Es. seconda guerra mondiale, logaritmi, fotosintesi..."></textarea><button id="explainBtn" class="form-primary">Spiegamelo <span>→</span></button><div id="out"></div></div>`;document.getElementById("explainBtn").addEventListener("click",explain)}
async function explain(){gaEvent("generate_explanation");const topic=document.getElementById("text").value.trim();if(!topic){document.getElementById("out").innerHTML=`<div class="result">Scrivi un argomento.</div>`;return}await send("/api/explain",JSON.stringify({topic}),{"Content-Type":"application/json"})}
function quizUI(){content.innerHTML=`${toolHeader("quiz","Genera quiz","QUIZ & CORREZIONE","Crea domande personalizzate, rispondi e ricevi una correzione dettagliata.")}<div class="form">${fileUI()}<textarea id="text" placeholder="Es. seconda guerra mondiale\n\nOppure incolla qui i tuoi appunti..."></textarea><div class="form-grid"><label class="field"><span>Difficoltà</span><select id="difficulty"><option>facile</option><option selected>media</option><option>difficile</option></select></label><label class="field"><span>Domande</span><input id="n" type="number" min="3" max="20" value="10"></label></div><button id="quizBtn" class="form-primary">Genera quiz <span>→</span></button><div id="out"></div></div>`;document.getElementById("quizBtn").addEventListener("click",quiz)}
async function quiz(){gaEvent("generate_quiz");const fd=new FormData(),f=document.getElementById("file").files[0],raw=document.getElementById("text").value.trim();if(f)fd.append("file",f);fd.append("text",raw);fd.append("difficulty",document.getElementById("difficulty").value);fd.append("n",document.getElementById("n").value);const out=document.getElementById("out");out.innerHTML="<div class=\"loading\">⏳ Generazione del quiz...</div>";const btn=document.getElementById("quizBtn");btn.disabled=true;try{const r=await fetch("/api/quiz",{method:"POST",body:fd});const d=await r.json();if(!r.ok){out.innerHTML=`<div class="result">❌ ${esc(d.error||"Errore")}</div>`;return}renderQuiz(d)}catch(e){out.innerHTML=`<div class="result">❌ Server non raggiungibile.</div>`}finally{btn.disabled=false}}
function renderQuiz(d){currentQuiz=d;let h=`<div class="quiz-header"><h3>${esc(d.title||"Quiz")}</h3><span class="quiz-count">${d.questions.length} domande</span></div><form id="qform">`;d.questions.forEach((q,i)=>{h+=`<div class="quizq" id="question-${i}"><div class="question-title"><b>${i+1}. ${esc(q.question)}</b></div><div class="options">${q.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"><span>${esc(o)}</span></label>`).join("")}</div><div class="feedback" id="feedback-${i}"></div></div>`});h+=`<button id="gradeBtn" class="grade-btn" type="button">✅ Correggi quiz</button></form><div id="score"></div>`;document.getElementById("out").innerHTML=h;document.getElementById("gradeBtn").addEventListener("click",grade)}
function grade(){if(!currentQuiz?.questions?.length)return;gaEvent("quiz_completed",{questions:currentQuiz.questions.length});let ok=0,answered=0;currentQuiz.questions.forEach((q,i)=>{const box=document.getElementById(`question-${i}`),feedback=document.getElementById(`feedback-${i}`),x=document.querySelector(`input[name="q${i}"]:checked`);box.classList.remove("correct","wrong","unanswered");if(x)answered++;if(x&&Number(x.value)===Number(q.correct)){ok++;box.classList.add("correct");feedback.innerHTML=`<div class="feedback-title"><span class="status-icon ok">✓</span> Corretta!</div>${q.explanation?`<div class="explanation">${esc(q.explanation)}</div>`:""}`}else if(x){box.classList.add("wrong");feedback.innerHTML=`<div class="feedback-title"><span class="status-icon no">×</span> Sbagliata</div><div class="correct-answer"><b>Risposta corretta:</b> ${esc(q.options[q.correct])}</div>${q.explanation?`<div class="explanation">${esc(q.explanation)}</div>`:""}`}else{box.classList.add("unanswered");feedback.innerHTML=`<div class="feedback-title"><span class="status-icon wait">!</span> Non risposta</div><div class="correct-answer"><b>Risposta corretta:</b> ${esc(q.options[q.correct])}</div>${q.explanation?`<div class="explanation">${esc(q.explanation)}</div>`:""}`}});const total=currentQuiz.questions.length,p=Math.round(ok/total*100);const wrong=total-ok;document.getElementById("score").innerHTML=`<div class="score-card"><div class="score"><span class="score-mark">✓</span>${ok}/${total}<small>${p}%</small></div><div class="score-details">${answered}/${total} risposte date · ${wrong} da rivedere</div><p>${p>=90?"🔥 Eccellente!":p>=80?"👏 Ottimo lavoro!":p>=60?"👍 Buono, ma ripassa gli errori.":"📚 Ripassa gli argomenti e riprova."}</p></div>`;document.getElementById("gradeBtn").disabled=true;document.getElementById("gradeBtn").textContent="Correzione completata ✓";document.querySelectorAll('#qform input[type="radio"]').forEach(x=>x.disabled=true);document.getElementById("score").scrollIntoView({behavior:"smooth",block:"nearest"})}
async function send(url,body,headers={}){const out=document.getElementById("out"),btn=document.querySelector("#out")?.closest(".form")?.querySelector("button");out.innerHTML="<div class=\"loading\">⏳ Sto elaborando...</div>";if(btn)btn.disabled=true;try{const r=await fetch(url,{method:"POST",body,headers});const d=await r.json();out.innerHTML=r.ok?`${modelBadge(d.model)}<article class="ai-output">${formatAIAnswer(d.answer)}</article>`:`<div class="result">❌ ${esc(d.error||"Errore")}</div>`}catch(e){out.innerHTML=`<div class="result">❌ Server non raggiungibile.</div>`}finally{if(btn)btn.disabled=false}}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function formatAIAnswer(raw){
  let source=String(raw??"").replace(/\r/g,"").replace(/```(?:markdown|md|text)?/gi,"").replace(/```/g,"").trim();
  if(!source)return "<p>Nessun contenuto restituito.</p>";
  const lines=source.split("\n"); let html="",inList=false;
  const closeList=()=>{if(inList){html+="</ul>";inList=false}};
  for(let line of lines){
    line=line.trim();
    if(!line){closeList();continue}
    let m=line.match(/^#{1,3}\s+(.+)$/);
    if(m){closeList();html+=`<h3>${esc(m[1].trim().replace(/\*/g,""))}</h3>`;continue}
    m=line.match(/^\*{1,2}(.+?)\*{1,2}$/);
    if(m && m[1].trim().length<100){closeList();html+=`<h3>${esc(m[1].trim())}</h3>`;continue}
    line=line.replace(/\*/g,"");
    if(/^[A-ZÀ-Ú][A-ZÀ-Ú0-9À-Ú\s·:&–—'’\-]{3,}$/.test(line) && line.length<90){closeList();html+=`<h3>${esc(line)}</h3>`;continue}
    m=line.match(/^[-•]\s+(.+)$/);
    if(m){if(!inList){html+="<ul>";inList=true}html+=`<li>${esc(m[1].trim())}</li>`;continue}
    closeList();
    html+=`<p>${esc(line)}</p>`;
  }
  closeList();
  return html;
}
function modelBadge(model){return model?`<div class="ai-model"><span class="ai-dot"></span> ${esc(model)}</div>`:""}
function flashcardsUI(){content.innerHTML=`${toolHeader("flashcards","Flashcard","RIPASSO INTELLIGENTE","Trasforma un argomento in carte rapide da usare per il ripasso attivo.")}<div class="form">${fileUI()}<textarea id="text" placeholder="Es. Rivoluzione francese\n\nOppure incolla qui i tuoi appunti..."></textarea><div class="form-row"><label class="field"><span>Numero di flashcard</span><input id="fcN" type="number" min="3" max="6" value="6"></label></div><button id="fcBtn" class="form-primary">Genera flashcard <span>→</span></button><div id="out"></div></div>`;document.getElementById("fcBtn").addEventListener("click",flashcards)}
async function flashcards(){gaEvent("generate_flashcards");const fd=new FormData(),f=document.getElementById("file").files[0],raw=document.getElementById("text").value.trim();if(f)fd.append("file",f);fd.append("text",raw);fd.append("n",document.getElementById("fcN").value);const out=document.getElementById("out"),btn=document.getElementById("fcBtn");if(!raw&&!f){out.innerHTML=`<div class="result">Inserisci un argomento, degli appunti o un file.</div>`;return}out.innerHTML='<div class="loading">⏳ Generazione delle flashcard...</div>';btn.disabled=true;try{const r=await fetch("/api/flashcards",{method:"POST",body:fd});const d=await r.json();if(!r.ok){out.innerHTML=`<div class="result">❌ ${esc(d.error||"Errore")}</div>`;return}renderFlashcards(d)}catch(e){out.innerHTML=`<div class="result">❌ Server non raggiungibile.</div>`}finally{btn.disabled=false}}
function sizeFlashcards(){document.querySelectorAll(".flashcard").forEach(card=>{const inner=card.querySelector(".flash-inner"),faces=[...card.querySelectorAll(".flash-face")];inner.style.height="auto";card.style.height="auto";const h=Math.min(520,Math.max(280,...faces.map(f=>f.scrollHeight)));inner.style.height=h+"px";card.style.height=h+"px"})}
function renderFlashcards(d){let h=`${modelBadge(d.aiModel)}<div class="flashcards-head"><h3>${esc(d.title||"Flashcard")}</h3><span>${d.cards.length} carte</span></div><p class="muted flash-help">Clicca una carta per girarla. Prova a rispondere prima di vedere il retro.</p><div class="flash-grid">`;d.cards.forEach((c,i)=>{h+=`<button type="button" class="flashcard" data-flip="${i}" aria-label="Flashcard ${i+1}"><span class="flash-inner"><span class="flash-face flash-front"><span class="fc-number">${i+1}</span><span class="fc-label">DOMANDA</span><strong>${esc(c.question)}</strong><span class="fc-action">Clicca per vedere la risposta ↻</span></span><span class="flash-face flash-back"><span class="fc-number">${i+1}</span><span class="fc-label">RISPOSTA</span><strong>${esc(c.answer)}</strong>${c.extra?`<span class="fc-extra">${esc(c.extra)}</span>`:""}<span class="fc-action">Clicca per tornare alla domanda ↻</span></span></span></button>`});h+=`</div>`;document.getElementById("out").innerHTML=h;sizeFlashcards();document.querySelectorAll(".flashcard").forEach(x=>x.addEventListener("click",()=>x.classList.toggle("flipped")));window.addEventListener("resize",sizeFlashcards,{once:true})}
let timer=1500,selectedMinutes=25,iv=null,pomoRunning=false;
function formatTimer(){return `${String(Math.floor(timer/60)).padStart(2,"0")}:${String(timer%60).padStart(2,"0")}`}
function pomoUI(){
  clearInterval(iv);iv=null;pomoRunning=false;selectedMinutes=25;timer=selectedMinutes*60;
  content.innerHTML=`${toolHeader("pomo","Pomodoro","FOCUS","Imposta la durata della sessione e concentrati senza distrazioni.")}<div class="pomo-panel"><div class="pomo-duration"><button type="button" class="pomo-step" id="pomoMinus" aria-label="Diminuisci durata">−</button><div class="pomo-time-wrap"><div class="pomo-time" id="timer">${formatTimer()}</div><span id="pomoUnit">minuti</span></div><button type="button" class="pomo-step" id="pomoPlus" aria-label="Aumenta durata">+</button></div><p id="pomoLabel">Sessione da ${selectedMinutes} minuti</p><div class="pomo-actions"><button type="button" id="startP" class="form-primary">Avvia sessione</button><button type="button" class="secondary-btn" id="resetP">Reset</button></div></div>`;
  const render=()=>{const el=document.getElementById("timer"),label=document.getElementById("pomoLabel");if(el)el.textContent=formatTimer();if(label)label.textContent=pomoRunning?"Sessione in corso":`Sessione da ${selectedMinutes} minuti`};
  const sync=()=>{const m=document.getElementById("pomoMinus"),p=document.getElementById("pomoPlus");if(m)m.disabled=pomoRunning||selectedMinutes<=1;if(p)p.disabled=pomoRunning||selectedMinutes>=180};
  window.pomoRender=render;window.pomoSync=sync;
  document.getElementById("pomoMinus").addEventListener("click",()=>{if(pomoRunning)return;selectedMinutes=Math.max(1,Math.min(180,selectedMinutes-5));timer=selectedMinutes*60;render();sync()});
  document.getElementById("pomoPlus").addEventListener("click",()=>{if(pomoRunning)return;selectedMinutes=Math.max(1,Math.min(180,selectedMinutes+5));timer=selectedMinutes*60;render();sync()});
  document.getElementById("startP").addEventListener("click",togglePomo);
  document.getElementById("resetP").addEventListener("click",resetP);
  render();sync();
}
function togglePomo(){if(pomoRunning){pauseP();}else{startP();}}
function startP(){
  if(pomoRunning||timer<=0)return;
  if(!iv)gaEvent("pomodoro_start");
  clearInterval(iv);pomoRunning=true;
  const btn=document.getElementById("startP");if(btn)btn.textContent="Pausa";
  window.pomoSync?.();window.pomoRender?.();
  iv=setInterval(()=>{timer=Math.max(0,timer-1);window.pomoRender?.();if(timer<=0){clearInterval(iv);iv=null;pomoRunning=false;const b=document.getElementById("startP");if(b)b.textContent="Avvia sessione";const label=document.getElementById("pomoLabel");if(label)label.textContent="Sessione terminata — fai una pausa";window.pomoSync?.();alert("Sessione terminata. Ora fai una pausa.")}},1000);
}
function pauseP(){
  if(!pomoRunning)return;
  clearInterval(iv);iv=null;pomoRunning=false;
  const btn=document.getElementById("startP");if(btn)btn.textContent="Riprendi sessione";
  const label=document.getElementById("pomoLabel");if(label)label.textContent="Sessione in pausa";
  window.pomoSync?.();
}
function resetP(){
  clearInterval(iv);iv=null;pomoRunning=false;timer=selectedMinutes*60;
  const el=document.getElementById("timer");if(el)el.textContent=formatTimer();
  const label=document.getElementById("pomoLabel");if(label)label.textContent=`Sessione da ${selectedMinutes} minuti`;
  const btn=document.getElementById("startP");if(btn)btn.textContent="Avvia sessione";
  window.pomoSync?.();
}
function calcUI(){content.innerHTML=`${toolHeader("calc","Calcolatore media","CALCOLATORI","Inserisci i voti e ottieni subito la media aritmetica.")}<div class="form"><label class="field"><span>Voti</span><input id="grades" placeholder="Es. 7, 8, 6.5, 9"></label><button id="avgBtn" class="form-primary">Calcola media <span>→</span></button><div id="out"></div></div>`;document.getElementById("avgBtn").addEventListener("click",avg)}function avg(){const a=document.getElementById("grades").value.split(",").map(Number).filter(Number.isFinite);document.getElementById("out").innerHTML=a.length?`<div class="result">Media: <b>${(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2)}</b></div>`:`<div class="result">Inserisci almeno un voto.</div>`}

window.addEventListener("DOMContentLoaded",()=>{
  try{const t=new URLSearchParams(location.search).get("tool");if(t&&["summary","quiz","flashcards","pdf","pomo","calc"].includes(t))setTimeout(()=>openTool(t),80)}catch(e){}
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",wait_for_update:500});
  try{setupAnalyticsConsent()}catch(e){console.error("Analytics consent setup failed",e); const el=document.getElementById("sfConsent"); if(el){el.hidden=false; el.innerHTML=`<div class="sf-consent-box" role="dialog" aria-label="Scelte statistiche"><div><strong>Privacy e statistiche</strong><p>Puoi permettere a StudioFacile di usare statistiche anonime per capire quali strumenti vengono utilizzati.</p></div><div class="sf-consent-actions"><button id="sfNo" type="button">Solo necessari</button><button id="sfYes" type="button">Accetta statistiche</button></div></div>`; el.querySelector("#sfYes")?.addEventListener("click",acceptAnalytics); el.querySelector("#sfNo")?.addEventListener("click",denyAnalytics)}}
  try{setupToolCarousel()}catch(e){console.warn("Carousel setup failed",e)}
});
const SEARCH_TOOLS=[
  {keys:["ai","assistant","riassunto","riassumi","appunti"],tool:"summary"},
  {keys:["spiega","spiegazione","argomento","materia"],tool:"explain"},
  {keys:["quiz","test","domande","correzione"],tool:"quiz"},
  {keys:["flashcard","flashcards","memoria","ripasso"],tool:"flashcards"},
  {keys:["pomodoro","timer","tempo","focus"],tool:"pomo"},
  {keys:["calcolatore","calcolo","media","percentuale","voto"],tool:"calc"}
];
function setupGlobalSearch(){
  const input=document.getElementById("globalSearch");
  if(!input)return;
  const open=()=>{input.focus();input.select()};
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();open()}});
  input.addEventListener("keydown",e=>{
    if(e.key!=="Enter")return;
    const q=input.value.trim().toLowerCase();
    if(!q)return;
    const hit=SEARCH_TOOLS.find(x=>x.keys.some(k=>q.includes(k)||k.includes(q)));
    if(hit){openTool(hit.tool);input.blur()}
    else{input.classList.add("search-miss");setTimeout(()=>input.classList.remove("search-miss"),450)}
  });
}
function playDemo(btn){
  const v=btn.parentElement.querySelector("video");
  if(!v)return;
  if(v.paused){v.play().catch(()=>{});btn.classList.add("playing");}
  else{v.pause();btn.classList.remove("playing");}
}

function setupToolCarousel(){
  const rail=document.querySelector('[data-carousel="tools"]');
  if(!rail || rail.dataset.ready)return;
  rail.dataset.ready="1";
  const viewport=document.createElement("div");
  viewport.className="tool-carousel-viewport";
  rail.parentNode.insertBefore(viewport,rail);
  viewport.appendChild(rail);
  rail.classList.add("tool-carousel-track");
  const originals=[...rail.children];
  originals.forEach(card=>rail.appendChild(card.cloneNode(true)));
  let x=0,shift=0,last=performance.now(),paused=false,raf=0;
  const refresh=()=>{
    const cards=[...rail.children].slice(0,originals.length);
    const gap=parseFloat(getComputedStyle(rail).gap)||16;
    shift=cards.reduce((sum,card)=>sum+card.getBoundingClientRect().width,0)+gap*Math.max(0,cards.length-1);
    if(shift>0){x=((x%shift)+shift)%shift;}
  };
  const tick=(now)=>{
    const dt=Math.min(50,now-last); last=now;
    if(!paused&&shift>0){
      x-=dt*0.042;
      if(x<=-shift)x+=shift;
      rail.style.transform=`translate3d(${x}px,0,0)`;
    }
    raf=requestAnimationFrame(tick);
  };
  refresh();
  requestAnimationFrame(()=>{refresh();last=performance.now();raf=requestAnimationFrame(tick)});
  window.addEventListener("resize",refresh,{passive:true});
  viewport.addEventListener("mouseenter",()=>paused=true);
  viewport.addEventListener("mouseleave",()=>paused=false);
  viewport.addEventListener("touchstart",()=>paused=true,{passive:true});
  viewport.addEventListener("touchend",()=>setTimeout(()=>paused=false,900),{passive:true});
  viewport.addEventListener("wheel",e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){e.preventDefault();x-=e.deltaX;paused=true;setTimeout(()=>paused=false,700)}},{passive:false});
}
