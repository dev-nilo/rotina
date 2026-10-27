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
import * as push from "./push.js";

const app = document.getElementById("app");

/**
 * Navegação: "home" (só o agora), "day" (o dia inteiro de `viewKey`), "settings" e "why".
 * A faixa de dias fica sempre visível em Hoje e no Dia; a engrenagem leva aos Ajustes.
 */
let screen = "home";
let viewKey = null;
/** Bloco aberto na lista do dia. null = o bloco atual; "none" = nenhum. */
let expanded = null;
/** Item marcado agora há pouco: ganha a animação de "pop" no próximo render. */
let popped = null;

/** Conversa aberta com o assistente (some ao fechar). */
const assistant = { open: false, input: "", loading: false, error: "", reply: "", pending: [], history: [] };

/** Editor manual de um bloco ou compromisso. `id` vazio = novo compromisso. */
const editor = { open: false, key: "", id: "", title: "", start: "", end: "", steps: "", error: "" };

/** Dia que está na tela; null = hoje. */
const viewing = () => (screen === "day" && viewKey) || dayKey();

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
/** Agenda de hoje, já com os ajustes do assistente. */
const schedule = () => scheduleFor(dayKey());

function go(to, key = null) {
  screen = to;
  viewKey = key;
  expanded = null;
  window.scrollTo(0, 0);
}

// MARK: - Ícones

const ICON = {
  check: '<path d="M7 12.5l3 3 7-7"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" class="icon" aria-hidden="true">${ICON[name]}</svg>`;

// MARK: - Concluídos

const stepId = (block, i) => `${block.id}:${i}`;

/** Um bloco está feito quando foi marcado inteiro ou quando todos os passos foram marcados. */
function blockDone(block, key = viewing()) {
  return isDone(block.id, key) || (block.steps.length > 0 && block.steps.every((_, i) => isDone(stepId(block, i), key)));
}

function toggleBlock(block) {
  const d = day(viewing());
  if (blockDone(block)) {
    const ids = new Set([block.id, ...block.steps.map((_, i) => stepId(block, i))]);
    d.done = d.done.filter((id) => !ids.has(id));
  } else {
    d.done.push(block.id);
  }
  save();
}

// MARK: - Datas

const keyDate = (key) => new Date(`${key}T12:00:00`);
const shiftKey = (key, days) => {
  const d = keyDate(key);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function dayLabel(key) {
  const today = dayKey();
  if (key === today) return "Hoje";
  if (key === shiftKey(today, 1)) return "Amanhã";
  if (key === shiftKey(today, -1)) return "Ontem";
  const s = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric" }).format(keyDate(key));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// MARK: - Topo

/**
 * Título com "voltar" à esquerda (`back` = tela de destino) e a engrenagem à direita.
 * Em Hoje e no Dia, a faixa de dias vem logo abaixo.
 */
function header(title, { back = null, strip = true, gear = true } = {}) {
  return `<header class="top">
      <div class="top-left">
        ${back ? `<button class="icon-btn" data-action="go-${back}" aria-label="Voltar">${icon("back")}</button>` : ""}
        <h1>${esc(title)}</h1>
      </div>
      ${gear ? `<button class="icon-btn gear" data-action="go-settings" aria-label="Ajustes">${icon("gear")}</button>` : ""}
    </header>
    ${strip ? dayStrip() : ""}`;
}

/** Uma semana para trás e duas para frente; o dia na tela fica destacado. */
function dayStrip() {
  const today = dayKey();
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
  const items = [];
  for (let i = -7; i <= 14; i++) {
    const key = shiftKey(today, i);
    const d = keyDate(key);
    const cls = [key === viewing() ? "on" : "", key === today ? "today" : "", peekDay(key)?.ops?.length ? "has-ops" : ""].join(" ");
    items.push(`<button class="day ${cls}" data-action="day-go" data-key="${key}">
        <small>${weekday.format(d).replace(".", "")}</small><strong>${d.getDate()}</strong>
      </button>`);
  }
  return `<nav class="strip" aria-label="Dias">${items.join("")}</nav>`;
}

// MARK: - Componentes

function checkButton(action, id, done, label) {
  return `<button class="check ${done ? "done" : ""} ${id === popped ? "pop" : ""}" data-action="${action}" data-id="${id}" aria-label="${done ? "Desmarcar" : "Marcar"} ${esc(label)}">${done ? icon("check") : ""}</button>`;
}

function focusField() {
  return `<section class="focus">
      <span class="eyebrow">Única Coisa</span>
      <textarea rows="1" data-input="focus" placeholder="Toque para definir">${esc(peekDay(viewing())?.focus ?? "")}</textarea>
    </section>`;
}

/** cat-modoro dentro do cartão: um botão quando parado; gato e tempo quando rodando. */
function catInline() {
  const t = state.timer;
  if (!t) {
    return `<div class="cat-inline">
        <button class="btn primary" data-action="timer-start">Iniciar foco · ${state.settings.timerPreset}</button>
      </div>`;
  }
  const label = t.phase === "focus" ? "Foco" : "Pausa";
  const cycles = day().cycles;
  return `<div class="cat-inline running">
      <div class="cat-row">
        ${cat.catSVG(t.phase)}
        <div>
          <div class="eyebrow">${label} · ${cycles} ${cycles === 1 ? "ciclo" : "ciclos"}</div>
          <div class="timer" data-timer>${cat.formatRemaining(cat.remaining())}</div>
        </div>
      </div>
      <div class="controls">
        ${state.push ? "" : `<button class="btn primary" data-action="timer-ics">Alarme</button>`}
        <button class="btn ${state.push ? "primary" : ""}" data-action="timer-skip">${t.phase === "focus" ? "Pausar" : "Pular pausa"}</button>
        <button class="btn ghost" data-action="timer-stop">Parar</button>
      </div>
    </div>`;
}

function checklist(items) {
  return `<ul class="steps">${items.map(({ id, text, done }) => `<li class="${done ? "is-done" : ""} ${id === popped ? "pop" : ""}">
      <button data-action="step" data-id="${id}">
        <span class="box">${done ? icon("check") : ""}</span><span>${esc(text)}</span>
      </button>
    </li>`).join("")}</ul>`;
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
  const showCat = state.timer || (mo.kind === "block" && b.id === "deep");

  return `<section class="card now">
      <div class="eyebrow">${eyebrow}</div>
      <h2>${esc(b.title)}</h2>
      ${checklist(b.steps.map((text, i) => ({ id: stepId(b, i), text, done: isDone(stepId(b, i)) || isDone(b.id) })))}
      ${showCat ? catInline() : ""}
      ${mo.kind === "block" ? `<div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div>` : ""}
    </section>`;
}

/** Modo caótico: as 3 âncoras no lugar do bloco atual. */
function anchorsCard() {
  return `<section class="card now">
      <div class="eyebrow">Dia caótico · 3 âncoras</div>
      <h2>Só isso hoje</h2>
      ${checklist(ANCHORS.map((a) => ({ id: a.id, text: a.title, done: isDone(a.id) })))}
      ${catInline()}
    </section>`;
}

/** Uma linha com o que vem depois, para não precisar abrir o dia. */
function nextLine(sched) {
  const wake = state.settings.wake;
  const mo = momentAt(sched, now(), wake);
  const next = mo.kind === "block" ? sched.find((b) => b.start >= mo.block.end) : null;
  if (!next) return "";
  return `<button class="next" data-action="go-day">
      <span class="eyebrow">Próximo</span>
      <span class="num">${clock(next.start, wake)}</span>
      <strong>${esc(next.title)}</strong>
    </button>`;
}

/** O dia inteiro numa lista compacta. O bloco atual já vem aberto; toque nos outros para ver os passos e editar. */
function dayList(sched) {
  const wake = state.settings.wake;
  const key = viewing();
  const today = dayKey();
  const mo = key === today ? momentAt(sched, now(), wake) : null;

  const rows = sched.map((b) => {
    const done = blockDone(b);
    const isNow = mo?.kind === "block" && mo.block.id === b.id;
    const past = mo ? mo.m >= b.end && !isNow : key < today;
    const open = expanded === b.id || (isNow && expanded === null);
    return `<div class="row ${isNow ? "is-now" : ""} ${done ? "is-done" : ""} ${past && !done ? "is-past" : ""}">
        <button class="row-main" data-action="expand" data-id="${b.id}" aria-expanded="${open}">
          <span class="time">${clock(b.start, wake)}</span>
          <span class="row-title">${esc(b.title)}${b.changed ? `<span class="tag">ajustado</span>` : ""}</span>
        </button>
        ${checkButton("toggle-block", b.id, done, b.title)}
        ${open ? `<div class="row-steps">
            ${b.steps.length ? `<span>${b.steps.map(esc).join(" · ")}</span>` : ""}
            <span class="row-actions">
              <button class="mini" data-action="edit-open" data-id="${b.id}">Editar</button>
              <button class="mini" data-action="block-remove" data-id="${b.id}">Remover</button>
            </span>
          </div>` : ""}
      </div>`;
  });

  const undo = peekDay(key)?.ops?.length
    ? `<button class="link small-link" data-action="ai-undo">Desfazer ajustes deste dia</button>`
    : "";
  return `<section>
      ${rows.join("")}
      <button class="add-row" data-action="edit-new">+ Compromisso</button>
      ${undo}
    </section>`;
}

function anchorsList() {
  return `<section>
      <div class="section-head"><span class="eyebrow">3 Âncoras</span></div>
      ${ANCHORS.map((a) => {
        const done = isDone(a.id, viewing());
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

const fab = () => `<button class="fab" data-action="ai-open" aria-label="Ajustar com o assistente">${icon("spark")}</button>`;

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

/** Tela inicial: só o agora, o próximo e o caminho para o dia inteiro. */
function homeScreen() {
  const d = day();
  if (!d.mode) return `${header("Hoje")}${chooser()}`;
  const sched = schedule();
  const card = d.mode === "structured" ? nowCard(sched) : anchorsCard();
  return `${header("Hoje")}
    ${focusField()}
    ${card}
    ${d.mode === "structured" ? nextLine(sched) : ""}
    <nav class="quiet-links">
      <button data-action="go-day">Ver o dia</button>
      <button data-action="switch-mode">${d.mode === "structured" ? "Dia caótico? Usar 3 âncoras" : "Voltar à agenda completa"}</button>
    </nav>
    ${fab()}`;
}

/** O dia inteiro (hoje ou outra data), com edição. */
function dayScreen() {
  const key = viewing();
  const mode = peekDay(key)?.mode;
  const body = mode === "chaotic"
    ? `${anchorsList()}${key === dayKey() ? `${taskList(true)}${taskList(false)}` : ""}`
    : dayList(scheduleFor(key));
  return `${header(dayLabel(key), { back: "home" })}
    ${key === dayKey() ? "" : focusField()}
    ${body}
    ${fab()}`;
}

function settingsScreen() {
  const s = state.settings;
  const execLeft = execMinutes(schedule());
  const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;

  return `${header("Ajustes", { back: "home", strip: false, gear: false })}
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
    ${pushSection(standalone)}
    <section class="form">
      ${getApiKey()
        ? `<div class="field"><span>Assistente</span><button class="btn small-btn" data-action="remove-key">Remover chave</button></div>
           <p class="hint">Chave da API do Claude salva só neste aparelho.</p>`
        : `<label class="field"><span>Chave da API</span><input type="password" data-apikey placeholder="sk-ant-…" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
           <p class="hint">Para o botão do assistente. Crie uma chave em console.anthropic.com → API Keys e cole aqui. Fica salva só neste aparelho; cada pedido custa poucos centavos.</p>`}
    </section>
    ${state.push ? "" : `<section class="form">
      <button class="btn primary wide" data-action="export-ics">Adicionar rotina ao Calendário</button>
      <p class="hint">Cria um evento diário para cada bloco, com alerta no início. Se mudar os horários, apague os eventos antigos e adicione de novo.</p>
    </section>`}
    ${standalone ? "" : `<section class="form"><p class="hint">Para instalar: no Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p></section>`}
    <button class="go-row" data-action="go-why"><span><strong>Por quê</strong><span class="muted">Os livros por trás da rotina</span></span>${icon("next")}</button>
    <button class="link small-link" data-action="reset-mode">Escolher de novo o modo de hoje</button>`;
}

/** As ideias dos livros, numa tela própria (aberta pelos Ajustes). */
function whyScreen() {
  return `${header("Por quê", { back: "settings", strip: false, gear: false })}${whySection()}`;
}

let pushError = "";

function pushSection(standalone) {
  if (!push.supported()) {
    return `<section class="form"><p class="hint">${standalone
      ? "Avisos precisam do iOS 16.4 ou mais novo."
      : "Para receber avisos, instale o app na Tela de Início e abra por lá."}</p></section>`;
  }
  return `<section class="form">
      ${state.push
        ? `<div class="field"><span>Avisos</span><button class="btn small-btn" data-action="push-off">Desligar</button></div>
           <p class="hint">Aviso no início de cada bloco e no fim do cat-modoro. Nos dias caóticos, só o cat-modoro.</p>`
        : `<button class="btn primary wide" data-action="push-on">Ativar avisos</button>
           <p class="hint">Aviso no início de cada bloco e no fim do cat-modoro, mesmo com o app fechado.</p>`}
      ${pushError ? `<p class="hint warn">${esc(pushError)}</p>` : ""}
    </section>`;
}

function whySection() {
  return `<section class="why">
      <p class="lead">Alinhar o trabalho mais caro do cérebro ao ritmo biológico, ir fundo numa coisa só e cuidar do corpo que vai carregar tudo isso por décadas.</p>
      ${PRINCIPLES.map((p) => `<article class="principle">
        <div class="principle-head"><strong>${esc(p.book)}</strong><span class="faint small">${esc(p.author)}</span></div>
        <p class="muted">${esc(p.idea)}</p>
        <p>→ ${esc(p.practice)}</p>
      </article>`).join("")}
    </section>`;
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

// MARK: - Edição manual

function editorSheet() {
  if (!editor.open) return "";
  return `<div class="sheet-backdrop" data-action="edit-close"></div>
    <section class="sheet" role="dialog" aria-label="Editar">
      <div class="sheet-head">
        <strong>${editor.id ? "Editar bloco" : "Novo compromisso"}</strong>
        <button class="x" data-action="edit-close" aria-label="Fechar">×</button>
      </div>
      <p class="muted small">${esc(dayLabel(editor.key))}</p>
      <form data-form="edit" class="edit-form">
        <label class="ef"><span>Nome</span><input name="title" value="${esc(editor.title)}" autocomplete="off" required></label>
        <div class="ef-row">
          <label class="ef"><span>Início</span><input type="time" name="start" value="${editor.start}" required></label>
          <label class="ef"><span>Fim</span><input type="time" name="end" value="${editor.end}" required></label>
        </div>
        <label class="ef"><span>Passos, um por linha</span><textarea name="steps" rows="3">${esc(editor.steps)}</textarea></label>
        ${editor.error ? `<p class="ai-error">${esc(editor.error)}</p>` : ""}
        <div class="controls">
          <button class="btn primary">Salvar</button>
          <button type="button" class="btn" data-action="edit-close">Cancelar</button>
        </div>
      </form>
    </section>`;
}

const newEventId = () => `evt-${Date.now().toString(36)}`;

function openEditor(id) {
  const key = viewing();
  const b = id ? scheduleFor(key).find((b) => b.id === id) : null;
  const wake = state.settings.wake;
  Object.assign(editor, {
    open: true, key, id: b ? b.id : "", error: "",
    title: b?.title ?? "",
    start: b ? clock(b.start, wake) : "",
    end: b ? clock(b.end, wake) : "",
    steps: b?.steps.join("\n") ?? "",
  });
}

/**
 * Grava a edição como ajustes do dia (os mesmos do assistente):
 * compromisso novo → add_event; compromisso existente → atualiza o próprio ajuste;
 * bloco da rotina com o mesmo horário → replace_block; com outro horário → vira compromisso.
 */
function saveEditor(form) {
  const title = form.title.value.trim();
  const start = form.start.value;
  const end = form.end.value;
  const steps = form.steps.value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 5);
  if (!title || !start || !end) {
    editor.error = "Preencha nome, início e fim.";
    return false;
  }

  const key = editor.key;
  const ops = day(key).ops;
  const own = ops.find((op) => op.action === "add_event" && op.id === editor.id);
  if (own) {
    Object.assign(own, { title, start, end, steps });
  } else if (!editor.id) {
    ops.push({ action: "add_event", id: newEventId(), date: key, start, end, title, steps });
  } else {
    const wake = state.settings.wake;
    const b = scheduleFor(key).find((b) => b.id === editor.id);
    if (b && clock(b.start, wake) === start && clock(b.end, wake) === end) {
      ops.push({ action: "replace_block", date: key, block_id: editor.id, title, steps });
    } else {
      ops.push({ action: "remove_block", date: key, block_id: editor.id });
      ops.push({ action: "add_event", id: newEventId(), date: key, start, end, title, steps });
    }
  }
  save();
  editor.open = false;
  return true;
}

function removeBlock(id) {
  const key = viewing();
  const d = day(key);
  const before = d.ops.length;
  d.ops = d.ops.filter((op) => !(op.action === "add_event" && op.id === id));
  if (d.ops.length === before) d.ops.push({ action: "remove_block", date: key, block_id: id });
  expanded = null;
  save();
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

function render() {
  const screens = { home: homeScreen, day: dayScreen, settings: settingsScreen, why: whyScreen };
  app.innerHTML = `<main class="screen">${screens[screen]()}</main>${assistantSheet()}${editorSheet()}`;
  popped = null;
  // Centraliza o dia escolhido na faixa de dias (sem rolar a página).
  const strip = app.querySelector(".strip");
  const on = strip?.querySelector(".day.on");
  if (strip && on) strip.scrollLeft = on.offsetLeft - strip.clientWidth / 2 + on.offsetWidth / 2;
  autosize();
  // Toda mudança de estado passa por aqui; o push só usa a rede se os avisos mudaram.
  push.sync();
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
    case "go-home":
      go("home");
      break;
    case "go-day":
      go("day");
      break;
    case "go-settings":
      go("settings");
      break;
    case "go-why":
      go("why");
      break;
    case "day-go":
      go("day", el.dataset.key);
      break;
    case "mode":
      day().mode = el.dataset.mode;
      break;
    case "switch-mode":
      day().mode = day().mode === "structured" ? "chaotic" : "structured";
      go("home");
      break;
    case "reset-mode":
      day().mode = null;
      go("home");
      break;
    case "toggle":
    case "step":
      toggleDone(id, viewing());
      popped = id;
      break;
    case "edit-open":
      openEditor(id);
      break;
    case "edit-new":
      openEditor("");
      break;
    case "edit-close":
      editor.open = false;
      break;
    case "block-remove":
      removeBlock(id);
      break;
    case "toggle-block": {
      const block = scheduleFor(viewing()).find((b) => b.id === id);
      if (block) toggleBlock(block);
      popped = id;
      break;
    }
    case "expand":
      expanded = el.getAttribute("aria-expanded") === "true" ? "none" : id;
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
      go("settings");
      break;
    case "ai-apply":
      applyPending();
      break;
    case "ai-discard":
      assistant.pending = [];
      assistant.reply = "";
      break;
    case "ai-undo":
      day(viewing()).ops = [];
      break;
    case "remove-key":
      setApiKey("");
      break;
    case "push-on":
      pushError = "";
      push.enable()
        .then((ok) => { if (!ok) pushError = "Permissão negada. Libere em Ajustes do iPhone → Notificações → Rotina."; })
        .catch((err) => { state.push = false; pushError = `Não deu para ativar: ${err.message}`; })
        .finally(() => { save(); render(); });
      return;
    case "push-off":
      pushError = "";
      push.disable().finally(render);
      return;
  }
  save();
  render();
});

app.addEventListener("input", (e) => {
  if (e.target.dataset.input === "ai") assistant.input = e.target.value;
  if (e.target.form?.dataset.form === "edit") editor[e.target.name] = e.target.value;
  if (e.target.dataset.input === "focus") {
    day(viewing()).focus = e.target.value;
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
  const editForm = e.target.closest("[data-form=edit]");
  if (editForm) {
    e.preventDefault();
    saveEditor(editForm);
    render();
    return;
  }
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
