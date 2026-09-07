
function applyTheme(){
  let theme="light";
  try{theme=localStorage.getItem("studiofacile-theme")||"light"}catch(e){}
  document.body.classList.toggle("dark",theme==="dark");
  const b=document.getElementById("themeToggle");
  if(b){
    b.textContent=theme==="dark"?"☀️":"🌙";
    b.setAttribute("aria-label",theme==="dark"?"Passa alla modalità chiara":"Passa alla modalità notte");
    b.title=theme==="dark"?"Passa alla modalità chiara":"Passa alla modalità notte";
  }
}
function toggleTheme(){
  const dark=!document.body.classList.contains("dark");
  document.body.classList.toggle("dark",dark);
  try{localStorage.setItem("studiofacile-theme",dark?"dark":"light")}catch(e){}
  const b=document.getElementById("themeToggle");
  if(b){
    b.textContent=dark?"☀️":"🌙";
    b.setAttribute("aria-label",dark?"Passa alla modalità chiara":"Passa alla modalità notte");
    b.title=dark?"Passa alla modalità chiara":"Passa alla modalità notte";
  }
  gaEvent("theme_toggle",{theme:dark?"dark":"light"});
}
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

function openTool(t){gaEvent("tool_open",{tool:t});modal.classList.remove("hidden");if(t==="summary")summaryUI();if(t==="quiz")quizUI();if(t==="explain")explainUI();if(t==="pomo")pomoUI();if(t==="calc")calcUI();if(t==="flashcards")flashcardsUI();setTimeout(setupGrow,0)}
function closeTool(){modal.classList.add("hidden");clearInterval(iv)}
function setupGrow(){document.querySelectorAll("textarea").forEach(x=>{if(x.dataset.growReady)return;x.dataset.growReady="1";x.addEventListener("input",()=>grow(x));grow(x)})}
function grow(x){x.style.height="180px";x.style.height=Math.min(x.scrollHeight,720)+"px";x.style.overflowY=x.scrollHeight>720?"auto":"hidden"}
function fileUI(){return `<input id="file" type="file" accept=".txt,.pdf"><div class="hint">TXT e PDF supportati (max 10 MB).</div>`}
function summaryUI(){content.innerHTML=`<h2>🧠 Riassumi e spiega</h2><p class="muted">Inserisci gli appunti o carica un file. L'AI lavora solo sul materiale che fornisci.</p><div class="form">${fileUI()}<textarea id="text" placeholder="Incolla qui il materiale da studiare..."></textarea><select id="level"><option>scuola superiore</option><option>scuola media</option><option>università</option></select><button id="summaryBtn">✨ Genera</button><div id="out"></div></div>`;document.getElementById("summaryBtn").addEventListener("click",summary)}
async function summary(){gaEvent("generate_summary");const fd=new FormData(),f=document.getElementById("file").files[0];if(f)fd.append("file",f);fd.append("text",document.getElementById("text").value);fd.append("level",document.getElementById("level").value);await send("/api/summarize",fd)}
function explainUI(){content.innerHTML=`<h2>💡 Spiegami questo</h2><p class="muted">Scrivi solo l'argomento: StudioFacile lo spiega usando le proprie conoscenze.</p><div class="form"><textarea id="text" placeholder="Es. seconda guerra mondiale, logaritmi, fotosintesi..."></textarea><button id="explainBtn">Spiegamelo →</button><div id="out"></div></div>`;document.getElementById("explainBtn").addEventListener("click",explain)}
async function explain(){gaEvent("generate_explanation");const topic=document.getElementById("text").value.trim();if(!topic){document.getElementById("out").innerHTML=`<div class="result">Scrivi un argomento.</div>`;return}await send("/api/explain",JSON.stringify({topic}),{"Content-Type":"application/json"})}
function quizUI(){content.innerHTML=`<h2>🎯 Genera quiz</h2><p class="muted">Puoi inserire un argomento (es. "seconda guerra mondiale") oppure i tuoi appunti. Dopo il quiz, StudioFacile corregge ogni risposta e mostra le spiegazioni.</p><div class="form">${fileUI()}<textarea id="text" placeholder="Es. seconda guerra mondiale\n\nOppure incolla qui i tuoi appunti..."></textarea><select id="difficulty"><option>facile</option><option selected>media</option><option>difficile</option></select><label class="small-label">Numero di domande</label><input id="n" type="number" min="3" max="20" value="10"><button id="quizBtn">🎯 Genera quiz</button><div id="out"></div></div>`;document.getElementById("quizBtn").addEventListener("click",quiz)}
async function quiz(){gaEvent("generate_quiz");const fd=new FormData(),f=document.getElementById("file").files[0],raw=document.getElementById("text").value.trim();if(f)fd.append("file",f);fd.append("text",raw);fd.append("difficulty",document.getElementById("difficulty").value);fd.append("n",document.getElementById("n").value);const out=document.getElementById("out");out.innerHTML="<div class=\"loading\">⏳ Generazione del quiz...</div>";const btn=document.getElementById("quizBtn");btn.disabled=true;try{const r=await fetch("/api/quiz",{method:"POST",body:fd});const d=await r.json();if(!r.ok){out.innerHTML=`<div class="result">❌ ${esc(d.error||"Errore")}</div>`;return}renderQuiz(d)}catch(e){out.innerHTML=`<div class="result">❌ Server non raggiungibile.</div>`}finally{btn.disabled=false}}
function renderQuiz(d){currentQuiz=d;let h=`<div class="quiz-header"><h3>${esc(d.title||"Quiz")}</h3><span class="quiz-count">${d.questions.length} domande</span></div><form id="qform">`;d.questions.forEach((q,i)=>{h+=`<div class="quizq" id="question-${i}"><div class="question-title"><b>${i+1}. ${esc(q.question)}</b></div><div class="options">${q.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"><span>${esc(o)}</span></label>`).join("")}</div><div class="feedback" id="feedback-${i}"></div></div>`});h+=`<button id="gradeBtn" class="grade-btn" type="button">✅ Correggi quiz</button></form><div id="score"></div>`;document.getElementById("out").innerHTML=h;document.getElementById("gradeBtn").addEventListener("click",grade)}
function grade(){if(!currentQuiz?.questions?.length)return;gaEvent("quiz_completed",{questions:currentQuiz.questions.length});let ok=0,answered=0;currentQuiz.questions.forEach((q,i)=>{const box=document.getElementById(`question-${i}`),feedback=document.getElementById(`feedback-${i}`),x=document.querySelector(`input[name="q${i}"]:checked`);box.classList.remove("correct","wrong","unanswered");if(x)answered++;if(x&&Number(x.value)===Number(q.correct)){ok++;box.classList.add("correct");feedback.innerHTML=`<div class="feedback-title">✅ Corretta!</div>${q.explanation?`<div class="explanation">${esc(q.explanation)}</div>`:""}`}else if(x){box.classList.add("wrong");feedback.innerHTML=`<div class="feedback-title">❌ Sbagliata</div><div class="correct-answer"><b>Risposta corretta:</b> ${esc(q.options[q.correct])}</div>${q.explanation?`<div class="explanation">${esc(q.explanation)}</div>`:""}`}else{box.classList.add("unanswered");feedback.innerHTML=`<div class="feedback-title">⚠️ Non risposta</div><div class="correct-answer"><b>Risposta corretta:</b> ${esc(q.options[q.correct])}</div>${q.explanation?`<div class="explanation">${esc(q.explanation)}</div>`:""}`}});const total=currentQuiz.questions.length,p=Math.round(ok/total*100);const wrong=total-ok;document.getElementById("score").innerHTML=`<div class="score-card"><div class="score">🏆 ${ok}/${total} — ${p}%</div><div class="score-details">${answered}/${total} risposte date · ${wrong} da rivedere</div><p>${p>=90?"🔥 Eccellente!":p>=80?"👏 Ottimo lavoro!":p>=60?"👍 Buono, ma ripassa gli errori.":"📚 Ripassa gli argomenti e riprova."}</p></div>`;document.getElementById("gradeBtn").disabled=true;document.getElementById("gradeBtn").textContent="Correzione completata ✓";document.querySelectorAll('#qform input[type="radio"]').forEach(x=>x.disabled=true);document.getElementById("score").scrollIntoView({behavior:"smooth",block:"nearest"})}
async function send(url,body,headers={}){const out=document.getElementById("out"),btn=document.querySelector("#out")?.closest(".form")?.querySelector("button");out.innerHTML="<div class=\"loading\">⏳ Sto elaborando...</div>";if(btn)btn.disabled=true;try{const r=await fetch(url,{method:"POST",body,headers});const d=await r.json();out.innerHTML=r.ok?`${modelBadge(d.model)}<div class="result">${esc(d.answer)}</div>`:`<div class="result">❌ ${esc(d.error||"Errore")}</div>`}catch(e){out.innerHTML=`<div class="result">❌ Server non raggiungibile.</div>`}finally{if(btn)btn.disabled=false}}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function modelBadge(model){return model?`<div class="ai-model">🤖 ${esc(model)}</div>`:""}
function flashcardsUI(){content.innerHTML=`<h2>🃏 Flashcard</h2><p class="muted">Scrivi un argomento oppure incolla i tuoi appunti. L'AI creerà carte domanda/risposta per aiutarti a ripassare.</p><div class="form">${fileUI()}<textarea id="text" placeholder="Es. Rivoluzione francese\n\nOppure incolla qui i tuoi appunti..."></textarea><label class="small-label">Numero di flashcard</label><input id="fcN" type="number" min="3" max="20" value="10"><button id="fcBtn">🃏 Genera flashcard</button><div id="out"></div></div>`;document.getElementById("fcBtn").addEventListener("click",flashcards)}
async function flashcards(){gaEvent("generate_flashcards");const fd=new FormData(),f=document.getElementById("file").files[0],raw=document.getElementById("text").value.trim();if(f)fd.append("file",f);fd.append("text",raw);fd.append("n",document.getElementById("fcN").value);const out=document.getElementById("out"),btn=document.getElementById("fcBtn");if(!raw&&!f){out.innerHTML=`<div class="result">Inserisci un argomento, degli appunti o un file.</div>`;return}out.innerHTML='<div class="loading">⏳ Generazione delle flashcard...</div>';btn.disabled=true;try{const r=await fetch("/api/flashcards",{method:"POST",body:fd});const d=await r.json();if(!r.ok){out.innerHTML=`<div class="result">❌ ${esc(d.error||"Errore")}</div>`;return}renderFlashcards(d)}catch(e){out.innerHTML=`<div class="result">❌ Server non raggiungibile.</div>`}finally{btn.disabled=false}}
function sizeFlashcards(){document.querySelectorAll(".flashcard").forEach(card=>{const inner=card.querySelector(".flash-inner"),faces=[...card.querySelectorAll(".flash-face")];inner.style.height="auto";card.style.height="auto";const h=Math.min(520,Math.max(280,...faces.map(f=>f.scrollHeight)));inner.style.height=h+"px";card.style.height=h+"px"})}
function renderFlashcards(d){let h=`${modelBadge(d.aiModel)}<div class="flashcards-head"><h3>${esc(d.title||"Flashcard")}</h3><span>${d.cards.length} carte</span></div><p class="muted flash-help">Clicca una carta per girarla. Prova a rispondere prima di vedere il retro.</p><div class="flash-grid">`;d.cards.forEach((c,i)=>{h+=`<button type="button" class="flashcard" data-flip="${i}" aria-label="Flashcard ${i+1}"><span class="flash-inner"><span class="flash-face flash-front"><span class="fc-number">${i+1}</span><span class="fc-label">DOMANDA</span><strong>${esc(c.question)}</strong><span class="fc-action">Clicca per vedere la risposta ↻</span></span><span class="flash-face flash-back"><span class="fc-number">${i+1}</span><span class="fc-label">RISPOSTA</span><strong>${esc(c.answer)}</strong>${c.extra?`<span class="fc-extra">${esc(c.extra)}</span>`:""}<span class="fc-action">Clicca per tornare alla domanda ↻</span></span></span></button>`});h+=`</div>`;document.getElementById("out").innerHTML=h;sizeFlashcards();document.querySelectorAll(".flashcard").forEach(x=>x.addEventListener("click",()=>x.classList.toggle("flipped")));window.addEventListener("resize",sizeFlashcards,{once:true})}
let timer=1500,iv;function pomoUI(){clearInterval(iv);timer=1500;content.innerHTML=`<h2>⏱️ Pomodoro</h2><div class="score" id="timer">25:00</div><button id="startP">Avvia</button> <button class="disabled" id="resetP">Reset</button>`;document.getElementById("startP").addEventListener("click",startP);document.getElementById("resetP").addEventListener("click",resetP)}
function startP(){gaEvent("pomodoro_start");clearInterval(iv);iv=setInterval(()=>{timer--;const el=document.getElementById("timer");if(el)el.textContent=`${String(Math.floor(timer/60)).padStart(2,"0")}:${String(timer%60).padStart(2,"0")}`;if(timer<=0){clearInterval(iv);alert("Pausa! 🎉")}},1000)}function resetP(){clearInterval(iv);timer=1500;document.getElementById("timer").textContent="25:00"}
function calcUI(){content.innerHTML=`<h2>🧮 Media</h2><div class="form"><input id="grades" placeholder="Es. 7, 8, 6.5, 9"><button id="avgBtn">Calcola</button><div id="out"></div></div>`;document.getElementById("avgBtn").addEventListener("click",avg)}function avg(){const a=document.getElementById("grades").value.split(",").map(Number).filter(Number.isFinite);document.getElementById("out").innerHTML=a.length?`<div class="result">Media: <b>${(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2)}</b></div>`:`<div class="result">Inserisci almeno un voto.</div>`}

window.addEventListener("DOMContentLoaded",()=>{
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",wait_for_update:500});
  try{applyTheme()}catch(e){console.warn("Theme setup failed",e)}
  try{setupAnalyticsConsent()}catch(e){console.error("Analytics consent setup failed",e); const el=document.getElementById("sfConsent"); if(el){el.hidden=false; el.innerHTML=`<div class="sf-consent-box" role="dialog" aria-label="Scelte statistiche"><div><strong>Privacy e statistiche</strong><p>Puoi permettere a StudioFacile di usare statistiche anonime per capire quali strumenti vengono utilizzati.</p></div><div class="sf-consent-actions"><button id="sfNo" type="button">Solo necessari</button><button id="sfYes" type="button">Accetta statistiche</button></div></div>`; el.querySelector("#sfYes")?.addEventListener("click",acceptAnalytics); el.querySelector("#sfNo")?.addEventListener("click",denyAnalytics)}}
});
