import {
  ANCHORS, PRINCIPLES, AWAKE_SPAN,
  buildSchedule, execMinutes, momentAt, clock, parseClock, duration,
} from "./routine.js";
import {
  state, save, now, day, dayKey, peekDay, logicalDate, toggleDone, isDone, getApiKey, setApiKey,
} from "./store.js";
import * as cat from "./catmodoro.js";
import { routineICS, phaseEndICS, openICS } from "./ics.js";
import { ask, scheduleFor, splitOps, SETTING_LABELS } from "./assistant.js";

const app = document.getElementById("app");
let tab = "today";
let expanded = null;

/** Conversa aberta com o assistente (some ao fechar). */
const assistant = { open: false, input: "", loading: false, error: "", reply: "", pending: [], history: [] };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
/** Agenda de hoje, já com os ajustes do assistente. */
const schedule = () => scheduleFor(dayKey());

// MARK: - Ícones

const ICON = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  check: '<path d="M7 12.5l3 3 7-7"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" class="icon" aria-hidden="true">${ICON[name]}</svg>`;

// MARK: - Concluídos

const stepId = (block, i) => `${block.id}:${i}`;

/** Um bloco está feito quando foi marcado inteiro ou quando todos os passos foram marcados. */
function blockDone(block) {
  return isDone(block.id) || (block.steps.length > 0 && block.steps.every((_, i) => isDone(stepId(block, i))));
}

function toggleBlock(block) {
  const d = day();
  if (blockDone(block)) {
    const ids = new Set([block.id, ...block.steps.map((_, i) => stepId(block, i))]);
    d.done = d.done.filter((id) => !ids.has(id));
  } else {
    d.done.push(block.id);
  }
  save();
}

// MARK: - Componentes

function checkButton(action, id, done, label) {
  return `<button class="check ${done ? "done" : ""}" data-action="${action}" data-id="${id}" aria-label="${done ? "Desmarcar" : "Marcar"} ${esc(label)}">${done ? icon("check") : ""}</button>`;
}

function header() {
  const s = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric" }).format(logicalDate());
  return `<header class="top">
      <h1>${esc(s.charAt(0).toUpperCase() + s.slice(1))}</h1>
      <button class="ai-button" data-action="ai-open">${icon("spark")}<span>Ajustar</span></button>
    </header>`;
}

/** Lembretes de uma linha: fim de semana e "nunca falhe duas vezes". */
function chips() {
  const out = [];
  const wd = logicalDate().getDay();
  if (wd === 0 || wd === 6) out.push(`Fim de semana: acordar até ${clock(60, state.settings.wake)}`);

  const yesterday = peekDay(dayKey(new Date(now().getTime() - 86400000)));
  const hasHistory = Object.keys(state.days).some((k) => k < dayKey() && state.days[k].done.length);
  const missed = yesterday ? yesterday.done.length === 0 : hasHistory;
  if (missed && !day().done.length) out.push("Ontem falhou? Hoje basta o despertar.");

  return out.length ? `<div class="chips">${out.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div>` : "";
}

function focusField() {
  return `<section class="focus">
      <span class="eyebrow">Única Coisa</span>
      <textarea rows="1" data-input="focus" placeholder="Toque para definir">${esc(day().focus)}</textarea>
    </section>`;
}

function catCard() {
  const t = state.timer;
  const preset = cat.PRESETS[state.settings.timerPreset];
  const phase = t?.phase ?? null;
  const label = phase === "focus" ? "Foco" : phase === "rest" ? "Pausa" : "cat-modoro";
  const time = t ? cat.formatRemaining(cat.remaining()) : `${preset.focus}:00`;

  const controls = t
    ? `<button class="btn primary" data-action="timer-ics">Alarme</button>
       <button class="btn" data-action="timer-skip">${phase === "focus" ? "Pausar" : "Pular pausa"}</button>
       <button class="btn ghost" data-action="timer-stop">Parar</button>`
    : `<button class="btn primary" data-action="timer-start">Iniciar foco</button>
       ${segmented("timerPreset", [["90/15", "90/15"], ["25/5", "25/5"]])}`;

  return `<section class="card cat-card phase-${phase ?? "idle"}">
      <div class="cat-row">
        ${cat.catSVG(phase)}
        <div>
          <div class="eyebrow">${label} · ${day().cycles} ${day().cycles === 1 ? "ciclo" : "ciclos"}</div>
          <div class="timer" data-timer>${time}</div>
        </div>
      </div>
      <div class="controls">${controls}</div>
    </section>`;
}

/** O cartão principal: o que fazer agora, como checklist. */
function nowCard(sched) {
  const wake = state.settings.wake;
  const mo = momentAt(sched, now(), wake);

  if (mo.kind === "sleep") {
    return `<section class="card now">
        <div class="eyebrow">Agora</div>
        <h2>Dormir</h2>
        <p class="sub">Acordar às ${clock(0, wake)}</p>
      </section>`;
  }

  const b = mo.kind === "block" ? mo.block : mo.next;
  const eyebrow = mo.kind === "block"
    ? `Agora · faltam ${duration(b.end - mo.m)}`
    : `A seguir · às ${clock(b.start, wake)}`;
  const pct = mo.kind === "block" ? ((mo.m - b.start) / (b.end - b.start)) * 100 : 0;

  return `<section class="card now">
      <div class="eyebrow">${eyebrow}</div>
      <h2>${esc(b.title)}</h2>
      <ul class="steps">${b.steps.map((s, i) => {
        const done = isDone(stepId(b, i)) || isDone(b.id);
        return `<li class="${done ? "is-done" : ""}">
            <button data-action="step" data-id="${stepId(b, i)}">
              <span class="box">${done ? icon("check") : ""}</span><span>${esc(s)}</span>
            </button>
          </li>`;
      }).join("")}</ul>
      ${mo.kind === "block" ? `<div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div>` : ""}
    </section>`;
}

/** O dia inteiro numa lista compacta. Toque num bloco para ver os passos. */
function dayList(sched) {
  const wake = state.settings.wake;
  const mo = momentAt(sched, now(), wake);

  const rows = sched.map((b) => {
    const done = blockDone(b);
    const isNow = mo.kind === "block" && mo.block.id === b.id;
    const past = mo.m >= b.end && !isNow;
    const open = expanded === b.id;
    return `<div class="row ${isNow ? "is-now" : ""} ${done ? "is-done" : ""} ${past && !done ? "is-past" : ""}">
        <button class="row-main" data-action="expand" data-id="${b.id}" aria-expanded="${open}">
          <span class="time">${clock(b.start, wake)}</span>
          <span class="row-title">${esc(b.title)}${b.changed ? `<span class="tag">ajustado</span>` : ""}</span>
        </button>
        ${checkButton("toggle-block", b.id, done, b.title)}
        ${open ? `<div class="row-steps">${b.steps.map(esc).join(" · ")}</div>` : ""}
      </div>`;
  });

  const doneCount = sched.filter(blockDone).length;
  const undo = day().ops.length
    ? `<button class="link small-link" data-action="ai-undo">Desfazer ajustes de hoje</button>`
    : "";
  return `<section>
      <div class="section-head"><span class="eyebrow">Dia</span><span class="eyebrow num">${doneCount}/${sched.length}</span></div>
      ${rows.join("")}
      ${undo}
    </section>`;
}

function anchorsList() {
  return `<section>
      <div class="section-head"><span class="eyebrow">3 Âncoras</span></div>
      ${ANCHORS.map((a) => {
        const done = isDone(a.id);
        return `<div class="row anchor ${done ? "is-done" : ""}">
            <div class="row-main static">
              <span class="row-title">${esc(a.title)}</span>
              <span class="row-sub">${esc(a.steps)}</span>
            </div>
            ${checkButton("toggle", a.id, done, a.title)}
          </div>`;
      }).join("")}
    </section>`;
}

function taskList(heavy) {
  const title = heavy ? "Manhã · alta carga" : "Tarde · baixa carga";
  const tasks = state.tasks.filter((t) => t.heavy === heavy);
  return `<section class="tasks">
      <div class="section-head"><span class="eyebrow">${title}</span></div>
      ${tasks.map((t) => `<div class="task ${t.done ? "is-done" : ""}">
          <button class="check small-check ${t.done ? "done" : ""}" data-action="task-toggle" data-id="${t.id}" aria-label="Marcar ${esc(t.title)}">${t.done ? icon("check") : ""}</button>
          <span class="task-title">${esc(t.title)}</span>
          <button class="x" data-action="task-delete" data-id="${t.id}" aria-label="Apagar ${esc(t.title)}">×</button>
        </div>`).join("")}
      <form data-form="task" data-heavy="${heavy}">
        <input name="title" placeholder="+ ${heavy ? "Criar, resolver, arquitetar" : "E-mails, reuniões, ajustes"}" autocomplete="off" enterkeyhint="done">
      </form>
    </section>`;
}

function segmented(key, options) {
  const current = state.settings[key];
  return `<div class="seg" role="radiogroup">${options
    .map(([value, label]) => `<button role="radio" aria-checked="${String(current) === String(value)}" data-action="set" data-key="${key}" data-value="${value}">${label}</button>`)
    .join("")}</div>`;
}

// MARK: - Telas

function chooser() {
  return `<div class="chooser">
      <h1>Como vai ser hoje?</h1>
      <button class="choice" data-action="mode" data-mode="structured">
        <strong>Estruturado</strong>
        <span class="muted">A agenda completa, bloco a bloco.</span>
      </button>
      <button class="choice" data-action="mode" data-mode="chaotic">
        <strong>Caótico</strong>
        <span class="muted">Só 3 âncoras. O resto flui.</span>
      </button>
    </div>`;
}

function todayScreen() {
  const d = day();
  if (!d.mode) return chooser();
  const sched = schedule();
  const mo = momentAt(sched, now(), state.settings.wake);
  const showCat = state.timer || (mo.kind === "block" && mo.block.id === "deep");

  const body = d.mode === "structured"
    ? [chips(), focusField(), nowCard(sched), showCat ? catCard() : "", dayList(sched)]
    : [chips(), focusField(), catCard(), anchorsList(), taskList(true), taskList(false)];

  const other = d.mode === "structured" ? "Dia caótico? Usar 3 Âncoras" : "Voltar para a agenda completa";
  return `${header()}${body.join("")}
      <button class="link" data-action="switch-mode">${other}</button>`;
}

function whyScreen() {
  return `<header class="top"><h1>Por quê</h1></header>
    <p class="lead">Alinhar o trabalho mais caro do cérebro ao ritmo biológico, ir fundo numa coisa só e cuidar do corpo que vai carregar tudo isso por décadas.</p>
    <section>${PRINCIPLES.map((p) => `<article class="principle">
        <div class="principle-head"><strong>${esc(p.book)}</strong><span class="faint small">${esc(p.author)}</span></div>
        <p class="muted">${esc(p.idea)}</p>
        <p>→ ${esc(p.practice)}</p>
      </article>`).join("")}</section>
    <section class="note">
      <div class="eyebrow">Fim de semana</div>
      <p>Acorde no máximo 60 min mais tarde. Dormiu tarde? Cochilo de 20–30 min no início da tarde, nunca despertar tardio.</p>
    </section>`;
}

function settingsScreen() {
  const s = state.settings;
  const execLeft = execMinutes(schedule());
  const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;

  return `<header class="top"><h1>Ajustes</h1></header>
    <section class="form">
      <label class="field"><span>Acordar às</span><input type="time" data-setting="wake" value="${clock(0, s.wake)}"></label>
      <div class="field"><span>Dormir às</span><span class="muted num">${clock(AWAKE_SPAN, s.wake)}</span></div>
      <p class="hint">A rotina inteira se desloca junto. Mantenha esse horário todos os dias, com no máximo 60 min de diferença no fim de semana.</p>
    </section>
    <section class="form">
      <div class="field"><span>Deep Work</span>${segmented("deepCycles", [[1, "1 ciclo"], [2, "2 ciclos"]])}</div>
      <div class="field"><span>Almoço</span>${segmented("lunch", [[60, "60"], [75, "75"], [90, "90"]])}</div>
      <label class="field"><span>Desligamento</span><input type="time" data-setting="shutdown" value="${clock(0, s.shutdown)}"></label>
      <div class="field"><span>Treino</span>${segmented("workout", [[45, "45"], [60, "60"], [75, "75"], [90, "90"]])}</div>
      ${execLeft < 30 ? `<p class="hint warn">Com esse desligamento, ${execLeft ? `sobram só ${execLeft} min` : "não sobra tempo"} de execução à tarde. Considere desligar mais tarde.</p>` : ""}
    </section>
    <section class="form">
      <div class="field"><span>cat-modoro</span>${segmented("timerPreset", [["90/15", "90/15"], ["25/5", "25/5"]])}</div>
    </section>
    <section class="form">
      ${getApiKey()
        ? `<div class="field"><span>Assistente</span><button class="btn small-btn" data-action="remove-key">Remover chave</button></div>
           <p class="hint">Chave da API do Claude salva só neste aparelho.</p>`
        : `<label class="field"><span>Chave da API</span><input type="password" data-apikey placeholder="sk-ant-…" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
           <p class="hint">Para o botão Ajustar. Crie uma chave em console.anthropic.com → API Keys e cole aqui. Fica salva só neste aparelho; cada pedido custa poucos centavos.</p>`}
    </section>
    <section class="form">
      <button class="btn primary wide" data-action="export-ics">Adicionar rotina ao Calendário</button>
      <p class="hint">Cria um evento diário para cada bloco, com alerta no início. Se mudar os horários, apague os eventos antigos e adicione de novo.</p>
    </section>
    ${standalone ? "" : `<section class="note"><div class="eyebrow">Instalar no iPhone</div>
      <p>No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p></section>`}
    <button class="link" data-action="reset-mode">Escolher de novo o modo de hoje</button>`;
}

// MARK: - Assistente

/** Só o que muda: itens novos ou com horário diferente, e o que sai do dia. */
function preview() {
  if (!assistant.pending.length) return "";
  const { settings, byDay } = splitOps(assistant.pending);
  const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric" });
  const sig = (b) => `${b.id}|${b.start}|${b.end}|${b.title}`;

  const always = assistant.pending
    .filter((op) => op.action === "change_setting")
    .map((op) => `<div class="pv-row"><span>${SETTING_LABELS[op.setting]}</span><strong>${esc(op.value)}</strong></div>`)
    .join("");

  const days = Object.entries(byDay).map(([key, ops]) => {
    const before = scheduleFor(key);
    const after = scheduleFor(key, settings, ops);
    const beforeSigs = new Set(before.map(sig));
    const afterIds = new Set(after.map((b) => b.id));
    const row = (b, cls = "") =>
      `<div class="pv-row ${cls}"><span class="num">${clock(b.start, settings.wake)}–${clock(b.end, settings.wake)}</span><span>${esc(b.title)}</span></div>`;
    const label = fmt.format(new Date(`${key}T12:00:00`));
    return `<div class="pv-day">
        <div class="eyebrow">${esc(label.charAt(0).toUpperCase() + label.slice(1))}</div>
        ${after.filter((b) => !beforeSigs.has(sig(b))).map((b) => row(b)).join("")}
        ${before.filter((b) => !afterIds.has(b.id)).map((b) => row(b, "is-removed")).join("")}
      </div>`;
  }).join("");

  return `<div class="preview">
      ${always ? `<div class="pv-day"><div class="eyebrow">A partir de agora</div>${always}</div>` : ""}
      ${days}
      <div class="controls">
        <button class="btn primary" data-action="ai-apply">Aplicar</button>
        <button class="btn" data-action="ai-discard">Descartar</button>
      </div>
    </div>`;
}

function assistantSheet() {
  if (!assistant.open) return "";
  const body = !getApiKey()
    ? `<p class="muted">Para usar o assistente, cole sua chave da API do Claude em Ajustes.</p>
       <button class="btn primary wide" data-action="ai-settings">Ir para Ajustes</button>`
    : `${assistant.reply
        ? `<p class="ai-reply">${esc(assistant.reply)}</p>`
        : `<p class="muted">Diga o que mudou. Ex.: “amanhã às 8h vou jogar bola”.</p>`}
       ${preview()}
       ${assistant.error ? `<p class="ai-error">${esc(assistant.error)}</p>` : ""}
       <form data-form="ai" class="ai-form">
         <textarea name="text" rows="2" data-input="ai" placeholder="Toque no microfone do teclado e fale" ${assistant.loading ? "disabled" : ""}>${esc(assistant.input)}</textarea>
         <button class="btn primary" ${assistant.loading ? "disabled" : ""}>${assistant.loading ? "Pensando…" : "Enviar"}</button>
       </form>`;

  return `<div class="sheet-backdrop" data-action="ai-close"></div>
    <section class="sheet" role="dialog" aria-label="Ajustar rotina">
      <div class="sheet-head"><strong>Ajustar rotina</strong><button class="x" data-action="ai-close" aria-label="Fechar">×</button></div>
      ${body}
    </section>`;
}

function resetAssistant() {
  Object.assign(assistant, { open: false, input: "", loading: false, error: "", reply: "", pending: [], history: [] });
}

function applyPending() {
  const { settings } = splitOps(assistant.pending);
  for (const op of assistant.pending) {
    if (op.action === "change_setting") state.settings[op.setting] = settings[op.setting];
    else day(op.date).ops.push(op);
  }
  save();
  resetAssistant();
}

async function sendToAssistant(text) {
  Object.assign(assistant, { loading: true, error: "", input: text });
  render();
  try {
    const res = await ask(getApiKey(), assistant.history, text);
    Object.assign(assistant, { reply: res.reply, pending: res.operations, history: res.history, input: "" });
  } catch (err) {
    assistant.error = err.message || "Algo deu errado. Tente de novo.";
  }
  assistant.loading = false;
  render();
}

// MARK: - Render

function tabBar() {
  const item = (id, name, label) =>
    `<button class="${tab === id ? "on" : ""}" data-action="tab" data-tab="${id}">${icon(name)}<span>${label}</span></button>`;
  return `<nav class="tabs">${item("today", "sun", "Hoje")}${item("why", "book", "Por quê")}${item("settings", "sliders", "Ajustes")}</nav>`;
}

function render() {
  const screen = tab === "today" ? todayScreen() : tab === "why" ? whyScreen() : settingsScreen();
  app.innerHTML = `<main class="screen">${screen}</main>${tabBar()}${assistantSheet()}`;
  // Cada tela tem a sua cor de fundo; a barra de status do iPhone acompanha.
  document.body.dataset.screen = tab === "today" && !day().mode ? "chooser" : tab;
  const page = getComputedStyle(document.body).getPropertyValue("--page").trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", page));
  autosize();
}

function autosize() {
  app.querySelectorAll("textarea").forEach((el) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  });
}

// MARK: - Eventos

app.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const { action, id } = el.dataset;

  switch (action) {
    case "tab":
      tab = el.dataset.tab;
      window.scrollTo(0, 0);
      break;
    case "mode":
      day().mode = el.dataset.mode;
      break;
    case "switch-mode":
      day().mode = day().mode === "structured" ? "chaotic" : "structured";
      break;
    case "reset-mode":
      day().mode = null;
      tab = "today";
      break;
    case "toggle":
    case "step":
      toggleDone(id);
      if (navigator.vibrate) navigator.vibrate(10);
      break;
    case "toggle-block": {
      const block = schedule().find((b) => b.id === id);
      if (block) toggleBlock(block);
      if (navigator.vibrate) navigator.vibrate(10);
      break;
    }
    case "expand":
      expanded = expanded === id ? null : id;
      break;
    case "set": {
      const raw = el.dataset.value;
      state.settings[el.dataset.key] = /^\d+$/.test(raw) ? Number(raw) : raw;
      break;
    }
    case "timer-start":
      cat.start();
      break;
    case "timer-stop":
      cat.stop();
      break;
    case "timer-skip":
      cat.skip();
      break;
    case "timer-ics":
      if (state.timer) openICS(phaseEndICS(state.timer), "cat-modoro.ics");
      return;
    case "export-ics":
      // A rotina base, sem os ajustes pontuais do assistente.
      openICS(routineICS(buildSchedule(state.settings, logicalDate().getDay()), state.settings.wake), "rotina.ics");
      return;
    case "task-toggle": {
      const t = state.tasks.find((t) => t.id === id);
      if (t) t.done = !t.done;
      break;
    }
    case "task-delete":
      state.tasks = state.tasks.filter((t) => t.id !== id);
      break;
    case "ai-open":
      assistant.open = true;
      render();
      app.querySelector("[data-input=ai]")?.focus();
      return;
    case "ai-close":
      if (assistant.loading) return;
      resetAssistant();
      break;
    case "ai-settings":
      resetAssistant();
      tab = "settings";
      break;
    case "ai-apply":
      applyPending();
      break;
    case "ai-discard":
      assistant.pending = [];
      assistant.reply = "";
      break;
    case "ai-undo":
      day().ops = [];
      break;
    case "remove-key":
      setApiKey("");
      break;
  }
  save();
  render();
});

app.addEventListener("input", (e) => {
  if (e.target.dataset.input === "ai") assistant.input = e.target.value;
  if (e.target.dataset.input === "focus") {
    day().focus = e.target.value;
    save();
    autosize();
  }
});

app.addEventListener("change", (e) => {
  if ("apikey" in e.target.dataset) {
    setApiKey(e.target.value.trim());
    render();
    return;
  }
  const key = e.target.dataset.setting;
  if (!key || !e.target.value) return;
  state.settings[key] = parseClock(e.target.value);
  save();
  render();
});

app.addEventListener("submit", (e) => {
  const aiForm = e.target.closest("[data-form=ai]");
  if (aiForm) {
    e.preventDefault();
    const text = aiForm.text.value.trim();
    if (text && !assistant.loading) sendToAssistant(text);
    return;
  }
  const form = e.target.closest("[data-form=task]");
  if (!form) return;
  e.preventDefault();
  const title = form.title.value.trim();
  if (!title) return;
  state.tasks.push({ id: crypto.randomUUID(), title, heavy: form.dataset.heavy === "true", done: false });
  save();
  render();
  app.querySelector(`[data-form=task][data-heavy="${form.dataset.heavy}"] input`)?.focus();
});

// Enter no campo da Única Coisa fecha o teclado.
app.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.dataset.input === "focus") {
    e.preventDefault();
    e.target.blur();
  }
});

// MARK: - Relógio

let lastFullRender = Date.now();
setInterval(() => {
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
  if (cat.tick() || (!typing && Date.now() - lastFullRender > 30000)) {
    if (!typing) {
      render();
      lastFullRender = Date.now();
      return;
    }
  }
  const timerEl = app.querySelector("[data-timer]");
  if (timerEl && state.timer) timerEl.textContent = cat.formatRemaining(cat.remaining());
}, 1000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    cat.tick();
    render();
  }
});

cat.tick();
render();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js");
}
