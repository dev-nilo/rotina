// Projeto Capitão América: complemento da rotina, não substituto.
// A semana, os horários e os passos de cada bloco continuam os de routine.js.
// Aqui ficam só os extras que aparecem dentro dos blocos que já existem:
// exercícios a mais nos treinos de força (com registro de carga), as quantidades
// das refeições e o peso/cintura no Início.

import { state, save, dayKey } from "./store.js";

/**
 * Exercícios por dia da semana (0 = domingo), só nos três dias de força.
 * base: já está nos passos do bloco (só ganha o registro de carga).
 * Faixa de reps: dupla progressão — fechou o topo em todas as séries, sobe a carga.
 */
const TRAIN = {
  1: [
    { id: "supino-halter", name: "Supino com halteres", sets: 3, reps: "8", base: true },
    { id: "remada-curvada", name: "Remada curvada", sets: 3, reps: "8", base: true },
    { id: "supino-inclinado", name: "Supino inclinado", sets: 3, reps: "8–10" },
    { id: "puxada", name: "Puxada aberta", sets: 3, reps: "8–12" },
    { id: "lateral-seg", name: "Elevação lateral", sets: 3, reps: "12–20" },
    { id: "rosca-direta", name: "Rosca direta + tríceps corda", sets: 2, reps: "10–12" },
  ],
  3: [
    { id: "terra-romeno", name: "Terra romeno", sets: 3, reps: "8", base: true },
    { id: "farmer", name: "Farmer's walk", sets: 4, reps: "30 m", base: true },
    { id: "barra-fixa", name: "Barra fixa (ou puxada)", sets: 3, reps: "6–10" },
    { id: "desenvolvimento-qua", name: "Desenvolvimento com halteres", sets: 3, reps: "8–10" },
    { id: "lateral-qua", name: "Elevação lateral", sets: 3, reps: "12–20" },
    { id: "rosca-martelo", name: "Rosca martelo", sets: 2, reps: "12" },
  ],
  5: [
    { id: "agachamento", name: "Agachamento livre", sets: 3, reps: "6", base: true },
    { id: "bulgaro", name: "Afundo búlgaro", sets: 3, reps: "8", base: true },
    { id: "desenvolvimento-sex", name: "Desenvolvimento", sets: 3, reps: "8", base: true },
    { id: "supino-reto", name: "Supino reto", sets: 3, reps: "8–10" },
    { id: "remada-sex", name: "Remada (máquina ou cabo)", sets: 3, reps: "10–12" },
    { id: "lateral-sex", name: "Elevação lateral", sets: 3, reps: "12–20" },
    { id: "triceps", name: "Tríceps corda ou testa", sets: 2, reps: "12" },
  ],
};

/** Dias de cardio forte: mais carboidrato. */
const CARB_DAYS = new Set([4, 6]); // quinta (zona 2) e sábado (VO2 máx)

const PRATO = "150–180 g de proteína · 4–5 colheres de arroz + 1 concha de feijão · salada à vontade";

/** Quantidades das refeições, presas a blocos que já existem. Devolve linhas de texto. */
function foodLines(blockId, weekday) {
  const carb = CARB_DAYS.has(weekday);
  const lines = {
    food: ["3 ovos + 2 pães + 1 fruta"],
    lunch: [PRATO, ...(carb ? ["Dia de cardio forte: +100 g de arroz"] : [])],
    exec: ["16:00 · vitamina: 2 bananas + 1 scoop de whey + 40 g de aveia + 300 ml de leite"],
    // Segunda: o bloco é o lanche pré-jogo e o jantar leve fica no Desacelerar.
    tribe: weekday === 1 ? ["Lanche: pão com ovo ou frango"] : [`Jantar: ${PRATO}`],
    sunset: weekday === 1 ? ["Jantar leve: 150 g de proteína + 2–3 colheres de arroz"] : [],
    church2: [`Depois do culto, jantar: ${PRATO}`],
  };
  // Domingo não tem bloco de café: vai no Início.
  if (blockId === "wake" && weekday === 0) return ["Café: 3 ovos + 2 pães + 1 fruta"];
  // Sábado: vitamina antes do VO2 máx, no bloco de hobbies.
  if (blockId === "hobby") return ["16:30 · vitamina antes do VO2 máx"];
  return lines[blockId] ?? [];
}

function data() {
  if (!state.shape) state.shape = { weights: {}, waist: {}, loads: {} };
  return state.shape;
}

/** O complemento de um bloco: { train?, food?, weigh? } ou null se não houver nada. */
export function extrasFor(block, weekday) {
  if (block.changed) return null; // bloco ajustado pelo assistente: vale o ajuste
  const out = {};
  if (block.id === "train" && TRAIN[weekday]) out.train = TRAIN[weekday];
  const food = foodLines(block.id, weekday);
  if (food.length) out.food = food;
  if (block.id === "wake") out.weigh = { waist: weekday === 1 };
  return Object.keys(out).length ? out : null;
}

// MARK: - Cargas

/** Registro de carga do dia `key`, se houver. */
export function loadOn(exId, key) {
  return (data().loads[exId] ?? []).find((e) => e.date === key) ?? null;
}

export function setLoad(exId, key, patch) {
  const log = (data().loads[exId] ??= []);
  let e = log.find((x) => x.date === key);
  if (!e) {
    e = { date: key, kg: null, top: false };
    log.push(e);
    log.sort((a, b) => a.date.localeCompare(b.date));
  }
  Object.assign(e, patch);
  save();
}

/** Carga da sessão anterior a `key`, para mostrar como referência. */
export function previousLoad(exId, key) {
  const log = data().loads[exId] ?? [];
  return [...log].reverse().find((e) => e.date < key && e.kg != null) ?? null;
}

// MARK: - Peso e cintura

export function weight(key) {
  return data().weights[key] ?? null;
}

export function waist(key) {
  return data().waist[key] ?? null;
}

export function setMeasure(kind, key, value) {
  const store = kind === "waist" ? data().waist : data().weights;
  if (value == null || Number.isNaN(value)) delete store[key];
  else store[key] = value;
  save();
}

const shift = (key, days) => {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function average(key, from, to) {
  const vals = [];
  for (let i = from; i <= to; i++) {
    const v = weight(shift(key, -i));
    if (v != null) vals.push(v);
  }
  return vals.length >= 3 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

/**
 * Média dos últimos 7 dias contra os 7 anteriores, com a regra de ajuste do plano.
 * Precisa de pelo menos 3 pesagens em cada semana.
 */
export function weightTrend(key = dayKey()) {
  const now = average(key, 0, 6);
  const before = average(key, 7, 13);
  if (now == null) return null;
  if (before == null) return { avg: now, delta: null, advice: "Média da semana. A comparação começa na próxima." };
  const delta = now - before;
  let advice = "Ritmo certo, mantém.";
  if (delta < 0.1) advice = "Parado. Se repetir na próxima semana: +200 kcal.";
  else if (delta > 0.5) advice = "Rápido demais: −200 kcal.";
  return { avg: now, delta, advice };
}
