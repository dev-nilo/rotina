import {
  ANCHORS, PRINCIPLES, LOADS, AWAKE_SPAN,
  buildSchedule, execMinutes, momentAt, clock, parseClock, duration,
} from "./routine.js";
import { state, save, now, day, dayKey, peekDay, logicalDate, toggleDone, isDone } from "./store.js";
import * as cat from "./catmodoro.js";
import { routineICS, phaseEndICS, openICS } from "./ics.js";

const app = document.getElementById("app");
let tab = "today";
let expanded = null;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const schedule = () => buildSchedule(state.settings);

// MARK: - Ícones

const ICON = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  check: '<path d="M7 12.5l3 3 7-7"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" class="icon" aria-hidden="true">${ICON[name]}</svg>`;

// MARK: - Componentes

function loadBar(load) {
  const level = LOADS[load].level;
  return `<span class="load" aria-label="Demanda ${LOADS[load].label}">${[0, 1, 2, 3]
    .map((i) => `<i class="${i < level ? "on" : ""}"></i>`).join("")}</span>`;
}

function checkButton(id, done, label) {
  return `<button class="check ${done ? "done" : ""}" data-action="toggle" data-id="${id}" aria-label="${done ? "Desmarcar" : "Marcar"} ${esc(label)}">${done ? icon("check") : ""}</button>`;
}

function weekDots() {
  const total = (d) => (d.mode === "chaotic" ? ANCHORS.length : schedule().length);
  const fmt = new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" });
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now().getTime() - i * 86400000);
    const d = peekDay(dayKey(date));
    const ids = d?.mode === "chaotic" ? ANCHORS.map((a) => a.id) : schedule().map((b) => b.id);
    const ratio = d?.mode ? d.done.filter((id) => ids.includes(id)).length / total(d) : 0;
    const label = fmt.format(new Date(date.getTime() - state.settings.wake * 60000)).toUpperCase();
    dots.push(`<div class="dot ${i === 0 ? "today" : ""}" title="${d?.cycles ?? 0} ciclos de foco">
        <span class="disc ${d?.cycles ? "focused" : ""}" style="--fill:${Math.round(ratio * 100)}%"></span>
        <small>${label}</small></div>`);
  }
  return `<div class="week">${dots.join("")}</div>`;
}

function header(title) {
  return `<header class="top"><h1>${esc(title)}</h1></header>`;
}

function todayTitle() {
  const s = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric" }).format(logicalDate());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function focusField() {
  return `<section class="focus">
      <div class="eyebrow">A Única Coisa</div>
      <textarea rows="1" data-input="focus" placeholder="O que torna o dia ganho?">${esc(day().focus)}</textarea>
    </section>`;
}

function catCard() {
  const t = state.timer;
  const preset = cat.PRESETS[state.settings.timerPreset];
  const phase = t?.phase ?? null;
  const label = phase === "focus" ? "Foco" : phase === "rest" ? "Pausa" : "cat-modoro";
  const time = t ? cat.formatRemaining(cat.remaining()) : `${preset.focus}:00`;
  const cycles = day().cycles;

  const controls = t
    ? `<button class="btn primary" data-action="timer-ics">Alarme no Calendário</button>
       <button class="btn" data-action="timer-skip">${phase === "focus" ? "Pausar agora" : "Pular pausa"}</button>
       <button class="btn ghost" data-action="timer-stop">Parar</button>`
    : `<button class="btn primary" data-action="timer-start">Iniciar foco</button>
       ${segmented("timerPreset", [["90/15", "90/15"], ["25/5", "25/5"]])}`;

  return `<section class="card cat-card phase-${phase ?? "idle"}">
      <div class="cat-row">
        ${cat.catSVG(phase)}
        <div>
          <div class="eyebrow accent">${label}</div>
          <div class="timer" data-timer>${time}</div>
          <div class="muted small">${cycles} ${cycles === 1 ? "ciclo" : "ciclos"} hoje</div>
        </div>
      </div>
      <div class="controls">${controls}</div>
    </section>`;
}

function nowCard(sched) {
  const wake = state.settings.wake;
  const mo = momentAt(sched, now(), wake);

  if (mo.kind === "block") {
    const b = mo.block;
    const pct = ((mo.m - b.start) / (b.end - b.start)) * 100;
    const action = b.id === "deep"
      ? (state.settings.deepCycles === 2 ? "2 ciclos de 90 min com 15 min de pausa real. " : "1 ciclo de 90–120 min. ") + b.action
      : b.action;
    return `<section class="card now">
        <div class="eyebrow accent">Agora</div>
        <h2>${esc(b.title)}</h2>
        <p class="muted">${esc(action)}</p>
        <div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div>
        <div class="meta"><span>${clock(b.start, wake)} – ${clock(b.end, wake)}</span><span>faltam ${duration(b.end - mo.m)}</span></div>
      </section>`;
  }
  if (mo.kind === "gap") {
    return `<section class="card now">
        <div class="eyebrow accent">Transição</div>
        <h2>Respire.</h2>
        <p class="muted">A seguir, ${esc(mo.next.title.toLowerCase())} às ${clock(mo.next.start, wake)}.</p>
      </section>`;
  }
  return `<section class="card now">
      <div class="eyebrow accent">Noite</div>
      <h2>Hora de dormir</h2>
      <p class="muted">Acordar às ${clock(0, wake)}. Oito horas de sono sustentam todo o resto.</p>
    </section>`;
}

function weekendNote() {
  const wd = logicalDate().getDay();
  if (wd !== 0 && wd !== 6) return "";
  const wake = state.settings.wake;
  return `<section class="note">
      <div class="eyebrow">Fim de semana</div>
      <strong>Acorde até ${clock(60, wake)}.</strong>
      <p class="muted">Dormiu tarde? Mantenha o despertar, tome sol e compense com um cochilo de 20–30 min entre ${clock(390, wake)} e ${clock(480, wake)}.</p>
    </section>`;
}

/** Hábitos Atômicos: se ontem não rolou, o que importa é não falhar duas vezes. */
function neverMissTwice() {
  const yesterday = peekDay(dayKey(new Date(now().getTime() - 86400000)));
  const hasHistory = Object.keys(state.days).some((k) => k < dayKey() && state.days[k].done.length);
  const missed = yesterday ? yesterday.done.length === 0 : hasHistory;
  if (!missed || day().done.length) return "";
  return `<section class="note">
      <div class="eyebrow">Nunca falhe duas vezes</div>
      <strong>Ontem não rolou. Tudo bem.</strong>
      <p>Hoje, só a primeira âncora já conta: acordar no horário, água e luz.</p>
    </section>`;
}

function timeline(sched) {
  const wake = state.settings.wake;
  const mo = momentAt(sched, now(), wake);
  const doneCount = sched.filter((b) => isDone(b.id)).length;

  const rows = sched.map((b) => {
    const done = isDone(b.id);
    const isNow = mo.kind === "block" && mo.block.id === b.id;
    const open = expanded === b.id;
    return `<div class="row ${isNow ? "is-now" : ""} ${done ? "is-done" : ""}">
        <span class="time">${clock(b.start, wake)}</span>
        <button class="row-main" data-action="expand" data-id="${b.id}" aria-expanded="${open}">
          <span class="row-title"><span>${esc(b.title)}</span>${loadBar(b.load)}</span>
          ${open ? `<span class="detail">
              <span>${esc(b.action)}</span>
              <span class="muted">${esc(b.why)}</span>
              <span class="faint small">${LOADS[b.load].label} · ${esc(b.source)}</span>
            </span>` : ""}
        </button>
        ${checkButton(b.id, done, b.title)}
      </div>`;
  });

  return `<section>
      <div class="section-head"><span class="eyebrow">Seu dia</span><span class="eyebrow num">${doneCount} de ${sched.length}</span></div>
      ${rows.join("")}
    </section>`;
}

function anchorsList() {
  return `<section>
      <div class="section-head"><span class="eyebrow">3 Âncoras</span></div>
      ${ANCHORS.map((a, i) => {
        const done = isDone(a.id);
        return `<div class="row anchor ${done ? "is-done" : ""}">
            <span class="time num">${i + 1}</span>
            <div class="row-main static">
              <span class="row-title"><span>${esc(a.title)}</span></span>
              <span class="detail"><span class="muted">${esc(a.detail)}</span></span>
            </div>
            ${checkButton(a.id, done, a.title)}
          </div>`;
      }).join("")}
    </section>`;
}

function taskList(heavy) {
  const title = heavy ? "Alta carga · manhã" : "Baixa carga · tarde";
  const hint = heavy ? "Criar, arquitetar, problemas difíceis" : "E-mails, reuniões, ajustes, burocracia";
  const tasks = state.tasks.filter((t) => t.heavy === heavy);
  return `<section class="tasks">
      <div class="section-head"><span class="eyebrow">${title}</span></div>
      <p class="faint small">${hint}</p>
      ${tasks.map((t) => `<div class="task ${t.done ? "is-done" : ""}">
          <button class="check small-check ${t.done ? "done" : ""}" data-action="task-toggle" data-id="${t.id}" aria-label="Marcar ${esc(t.title)}">${t.done ? icon("check") : ""}</button>
          <span class="task-title">${esc(t.title)}</span>
          <button class="x" data-action="task-delete" data-id="${t.id}" aria-label="Apagar ${esc(t.title)}">×</button>
        </div>`).join("")}
      <form data-form="task" data-heavy="${heavy}">
        <input name="title" placeholder="Adicionar tarefa" autocomplete="off" enterkeyhint="done">
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
      <p class="eyebrow">${esc(todayTitle())}</p>
      <h1>Como vai ser hoje?</h1>
      <button class="choice" data-action="mode" data-mode="structured">
        <strong>Dia estruturado</strong>
        <span class="muted">A agenda completa, bloco a bloco.</span>
      </button>
      <button class="choice" data-action="mode" data-mode="chaotic">
        <strong>Dia caótico</strong>
        <span class="muted">Só as 3 âncoras. O resto flui conforme a energia.</span>
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
    ? [nowCard(sched), showCat ? catCard() : "", focusField(), neverMissTwice(), weekendNote(), timeline(sched)]
    : [catCard(), focusField(), neverMissTwice(), weekendNote(), anchorsList(), taskList(true), taskList(false)];

  const other = d.mode === "structured" ? "Hoje está caótico? Trocar para 3 Âncoras" : "Trocar para o dia estruturado";
  return `${header(todayTitle())}${weekDots()}${body.join("")}
      <button class="link" data-action="switch-mode">${other}</button>`;
}

function whyScreen() {
  return `${header("Por quê")}
    <p class="lead">Produtividade sustentável não vem de acordar às 5h sacrificando o sono. Vem de alinhar o trabalho mais caro do cérebro ao seu ritmo biológico, ir fundo numa coisa só e cuidar do corpo que vai carregar tudo isso por décadas.</p>
    <section>${PRINCIPLES.map((p) => `<article class="principle">
        <div class="row-title"><strong>${esc(p.book)}</strong><span class="faint small">${esc(p.author)}</span></div>
        <p class="muted">${esc(p.idea)}</p>
        <p>→ ${esc(p.practice)}</p>
      </article>`).join("")}</section>
    <section class="note">
      <div class="eyebrow">Regra de ouro do fim de semana</div>
      <p class="muted">Acorde no máximo 60 min mais tarde. Se dormiu tarde, compense com um cochilo de 20–30 min no início da tarde, nunca com despertar tardio.</p>
    </section>`;
}

function settingsScreen() {
  const s = state.settings;
  const sched = schedule();
  const execLeft = execMinutes(sched);
  const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;

  return `${header("Ajustes")}
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
      <button class="btn primary wide" data-action="export-ics">Adicionar rotina ao Calendário</button>
      <p class="hint">Cria um evento diário para cada bloco, com alerta no início. Se mudar os horários, apague os eventos antigos e adicione de novo.</p>
    </section>
    ${standalone ? "" : `<section class="note"><div class="eyebrow">Instalar no iPhone</div>
      <p class="muted">No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p></section>`}
    <button class="link" data-action="reset-mode">Escolher de novo o modo de hoje</button>`;
}

// MARK: - Render

function tabBar() {
  const item = (id, name, label) =>
    `<button class="${tab === id ? "on" : ""}" data-action="tab" data-tab="${id}">${icon(name)}<span>${label}</span></button>`;
  return `<nav class="tabs">${item("today", "sun", "Hoje")}${item("why", "book", "Por quê")}${item("settings", "sliders", "Ajustes")}</nav>`;
}

function render() {
  const screen = tab === "today" ? todayScreen() : tab === "why" ? whyScreen() : settingsScreen();
  app.innerHTML = `<main class="screen">${screen}</main>${tabBar()}`;
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
      toggleDone(id);
      if (navigator.vibrate) navigator.vibrate(10);
      break;
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
      openICS(routineICS(schedule(), state.settings.wake), "rotina.ics");
      return;
    case "task-toggle": {
      const t = state.tasks.find((t) => t.id === id);
      if (t) t.done = !t.done;
      break;
    }
    case "task-delete":
      state.tasks = state.tasks.filter((t) => t.id !== id);
      break;
  }
  save();
  render();
});

app.addEventListener("input", (e) => {
  if (e.target.dataset.input === "focus") {
    day().focus = e.target.value;
    save();
    autosize();
  }
});

app.addEventListener("change", (e) => {
  const key = e.target.dataset.setting;
  if (!key || !e.target.value) return;
  state.settings[key] = parseClock(e.target.value);
  save();
  render();
});

app.addEventListener("submit", (e) => {
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
