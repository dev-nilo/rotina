// Projeto Capitão América: complemento da rotina, não substituto.
// A semana, os horários e os passos de cada bloco continuam os de routine.js.
// Aqui ficam só os extras que aparecem dentro dos blocos que já existem:
// exercícios a mais nos treinos de força (com registro de carga), as quantidades
// das refeições e o peso/cintura no Início.

import { state, save, dayKey } from "./store.js";

/**
 * Exercícios por dia da semana (0 = domingo), iguais nas duas semanas (ver TRAIN em routine.js).
 * base: já está nos passos do bloco (só ganha o registro de carga).
 * Faixa de reps: dupla progressão — fechou o topo em todas as séries, sobe a carga.
 * Os ids guardam o histórico de carga: o mesmo exercício usa o mesmo id em qualquer dia.
 */
const TRAIN = {
  1: [
    { id: "supino-inclinado", name: "Supino inclinado", sets: 3, reps: "8–10", base: true },
    { id: "remada-curvada", name: "Remada curvada", sets: 3, reps: "8–12", base: true },
    { id: "lateral", name: "Elevação lateral", sets: 3, reps: "12–20", base: true },
    { id: "puxada", name: "Puxada aberta", sets: 3, reps: "8–12" },
    { id: "crossover", name: "Crossover de baixo pra cima", sets: 2, reps: "12–15" },
    { id: "rosca-direta", name: "Rosca direta", sets: 2, reps: "10–12" },
  ],
  2: [
    { id: "lateral", name: "Elevação lateral", sets: 3, reps: "15–20", base: true },
    { id: "rosca-direta", name: "Rosca direta", sets: 2, reps: "12", base: true },
    { id: "triceps", name: "Tríceps corda", sets: 2, reps: "12", base: true },
    { id: "face-pull", name: "Face pull", sets: 2, reps: "15" },
  ],
  3: [
    { id: "agachamento", name: "Agachamento livre", sets: 3, reps: "6–8", base: true },
    { id: "terra-romeno", name: "Terra romeno", sets: 3, reps: "8", base: true },
    { id: "bulgaro", name: "Afundo búlgaro", sets: 3, reps: "8", base: true },
    { id: "panturrilha", name: "Panturrilha em pé", sets: 3, reps: "12–15" },
  ],
  4: [
    { id: "barra-fixa", name: "Barra fixa (ou puxada)", sets: 3, reps: "6–10", base: true },
    { id: "supino-reto", name: "Supino reto", sets: 3, reps: "8–10", base: true },
    { id: "desenvolvimento", name: "Desenvolvimento com halteres", sets: 3, reps: "8–10", base: true },
    { id: "remada-baixa", name: "Remada baixa", sets: 3, reps: "10–12" },
    { id: "lateral", name: "Elevação lateral", sets: 3, reps: "12–20" },
    { id: "rosca-martelo", name: "Rosca martelo", sets: 2, reps: "12" },
  ],
  5: [
    { id: "desenvolvimento-maq", name: "Desenvolvimento na máquina", sets: 3, reps: "8–12", base: true },
    { id: "lateral", name: "Elevação lateral", sets: 4, reps: "12–20", base: true },
    { id: "rosca-direta", name: "Rosca direta", sets: 3, reps: "10–12", base: true },
    { id: "triceps", name: "Tríceps corda", sets: 3, reps: "10–12", base: true },
    { id: "crucifixo-invertido", name: "Crucifixo invertido", sets: 3, reps: "12–15" },
    { id: "rosca-martelo", name: "Rosca martelo", sets: 2, reps: "12" },
  ],
};

const PRATO = "150–180 g de proteína · 4–5 colheres de arroz + 1 concha de feijão · salada à vontade";

/**
 * Quantidades das refeições, presas a blocos que já existem. Devolve linhas de texto.
 * Dia presencial = 30 km de bike: uns 500 kcal a mais, em carboidrato e num lanche extra.
 */
function foodLines(blockId, weekday, office) {
  if (blockId === "wake" && weekday === 0) return ["Café: 3 ovos + 2 pães + 1 fruta"]; // domingo não tem bloco de café
  if (blockId === "hobby") return ["16:30 · vitamina antes da corrida"]; // sábado
  if (office) {
    return {
      food: ["3 ovos + 2 pães + 1 fruta, antes de pedalar"],
      triage: ["11:30 · pré-treino: 1 banana + 1 pão"],
      lunch: [`Marmita: ${PRATO}`, "Dia de bike: +100 g de arroz"],
      exec: ["16:30 · lanche antes da volta: pão com frango ou a vitamina"],
      tribe: [`Jantar: ${PRATO}`, "Dia de bike: +2 colheres de arroz"],
    }[blockId] ?? [];
  }
  return {
    food: ["3 ovos + 2 pães + 1 fruta"],
    lunch: [PRATO, ...(weekday === 6 ? ["Dia de corrida: +100 g de arroz"] : [])],
    exec: ["15:45 · vitamina: 2 bananas + 1 scoop de whey + 40 g de aveia + 300 ml de leite"],
    tribe: [`Jantar: ${PRATO}`],
    church2: [`Depois do culto, jantar: ${PRATO}`],
  }[blockId] ?? [];
}

function data() {
  if (!state.shape) state.shape = { weights: {}, waist: {}, loads: {} };
  return state.shape;
}

/** O complemento de um bloco: { train?, food?, weigh? } ou null se não houver nada. */
export function extrasFor(block, weekday, office = false) {
  if (block.changed) return null; // bloco ajustado pelo assistente: vale o ajuste
  const out = {};
  if (block.id === "train" && TRAIN[weekday]) out.train = TRAIN[weekday];
  const food = foodLines(block.id, weekday, office);
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
