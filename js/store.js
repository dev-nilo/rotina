// Estado do app num único JSON em localStorage (como RoutineStore.swift).
// Fica só neste aparelho: sem conta, sem servidor.

const KEY = "rotina.v2";

export const DEFAULT_SETTINGS = {
  wake: 6 * 60 + 30,
  deepCycles: 2,
  shutdown: 17 * 60,
  workout: 75,
  lunch: 90,
  timerPreset: "90/15",
};

function fresh() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    // dia lógico (yyyy-mm-dd) → { mode, done: [ids], focus, cycles }
    days: {},
    tasks: [], // { id, title, heavy, done }
    timer: null, // ver catmodoro.js
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) return { ...fresh(), ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings } };
  } catch {}
  return fresh();
}

export const state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

/** Relógio do app. Para testar outros horários: window.__now = "2026-10-24T09:00". */
export function now() {
  return window.__now ? new Date(window.__now) : new Date();
}

/** O dia começa no despertar, não à meia-noite: 01:00 ainda conta como ontem. */
export function dayKey(date = now()) {
  const d = new Date(date.getTime() - state.settings.wake * 60000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function logicalDate(date = now()) {
  return new Date(date.getTime() - state.settings.wake * 60000);
}

export function day(key = dayKey()) {
  if (!state.days[key]) state.days[key] = { mode: null, done: [], focus: "", cycles: 0 };
  return state.days[key];
}

/** Lê um dia sem criá-lo (para o histórico). */
export function peekDay(key) {
  return state.days[key];
}

export function toggleDone(id) {
  const d = day();
  const i = d.done.indexOf(id);
  if (i >= 0) d.done.splice(i, 1);
  else d.done.push(id);
  save();
}

export function isDone(id) {
  return day().done.includes(id);
}
