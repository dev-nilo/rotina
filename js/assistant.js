// Assistente: entende um pedido em português ("amanhã 8h vou jogar bola")
// e devolve ajustes na rotina para o usuário aprovar.
// Roda direto do iPhone com a chave da API do próprio usuário (sem servidor).

import { buildSchedule, applyOps, clock, weekdayOf } from "./routine.js";
import { state, dayKey, now, peekDay } from "./store.js";

// O SDK só é baixado quando o assistente é usado; o resto do app continua offline.
const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.132.1/+esm";
const MODEL = "claude-opus-5-5";

const SETTINGS = ["wake", "shutdown", "deepCycles", "lunch", "workout", "timerPreset"];

// Formato fixo da resposta. Campos que não se aplicam vêm vazios.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "operations"],
  properties: {
    reply: { type: "string" },
    operations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action", "date", "block_id", "start", "end", "title", "steps", "setting", "value"],
        properties: {
          action: { type: "string", enum: ["add_event", "replace_block", "remove_block", "change_setting"] },
          date: { type: "string" },
          block_id: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          title: { type: "string" },
          steps: { type: "array", items: { type: "string" } },
          setting: { type: "string", enum: ["none", ...SETTINGS] },
          value: { type: "string" },
        },
      },
    },
  },
};

const SYSTEM = `Você ajusta a rotina diária de uma pessoa a partir de pedidos curtos em português, muitas vezes ditados por voz (pode haver erros de transcrição). Responda só com o JSON do formato pedido.

A rotina é feita de blocos com id fixo. Você recebe a agenda dos próximos 7 dias e os ajustes atuais.

Operações:
- add_event: compromisso pontual num dia (date YYYY-MM-DD, start e end HH:MM, title, steps). Se a pessoa não disser a duração, estime (futebol ~90 min, consulta ~60 min). Os blocos que o evento cobre são encurtados automaticamente pelo app; não os remova por isso.
- replace_block: troca título e passos de um bloco num dia, mantendo o horário (date, block_id, title, steps).
- remove_block: tira um bloco de um dia (date, block_id). Prefira replace_block.
- change_setting: mudança permanente ("a partir de agora", "sempre", "todo dia"). setting e value: wake e shutdown em HH:MM; deepCycles "1" ou "2"; lunch "60", "75" ou "90"; workout "45", "60", "75" ou "90"; timerPreset "90/15" ou "25/5". Nada além disso é permanente.

Entenda o contexto:
- Se o evento cumpre a função de um bloco (esporte ou exercício → treino; refeição → almoço ou café da manhã), use replace_block nesse bloco no mesmo dia, colocando algo útil no lugar conforme o horário: recuperação e alongamento, tempo livre, ou trabalho leve.
- Se o evento cai sobre o Deep Work, ele fica mais curto. Diga isso no reply e, se houver espaço, sugira repor parte do foco com add_event.
- Se o pedido for ambíguo (dia ou horário impossível de inferir), não invente: operations vazio e uma pergunta curta no reply.

Formato:
- reply: 1 ou 2 frases curtas em português, dizendo o que vai mudar.
- steps: 1 a 3 passos curtos (até 5 palavras), no infinitivo.
- Campos que não se aplicam à operação: string vazia, steps [] e setting "none".`;

let sdk;
async function loadSDK() {
  sdk ??= (await import(SDK_URL)).default;
  return sdk;
}

/** Agenda de um dia já com os ajustes guardados (e os pendentes, para a prévia). */
export function scheduleFor(key, settings = state.settings, extraOps = []) {
  const base = buildSchedule(settings, weekdayOf(key));
  return applyOps(base, [...(peekDay(key)?.ops ?? []), ...extraOps], settings.wake);
}

/** Os próximos 7 dias, em texto compacto, para o modelo saber o que existe. */
function context() {
  const s = state.settings;
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
  const lines = [];
  for (let i = 0; i < 7; i++) {
    const key = dayKey(new Date(now().getTime() + i * 86400000));
    const date = new Date(`${key}T12:00:00`);
    lines.push(`\n${key} (${weekday.format(date)}${i === 0 ? ", hoje" : i === 1 ? ", amanhã" : ""}):`);
    for (const b of scheduleFor(key)) {
      lines.push(`  ${b.id} ${clock(b.start, s.wake)}–${clock(b.end, s.wake)} ${b.title}`);
    }
  }
  return `Agora: ${now().toTimeString().slice(0, 5)}.
Ajustes permanentes: acordar ${clock(0, s.wake)}, desligamento ${clock(0, s.shutdown)}, Deep Work ${s.deepCycles} ciclo(s), almoço ${s.lunch} min, treino ${s.workout} min, cat-modoro ${s.timerPreset}.
Agenda:${lines.join("\n")}`;
}

/**
 * Manda o pedido e devolve { reply, operations, content }.
 * `history` é a conversa desta sessão do assistente (content blocks do Claude, sem edição).
 */
export async function ask(apiKey, history, text) {
  const Anthropic = await loadSDK();
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const userText = history.length ? text : `${context()}\n\nPedido: ${text}`;
  const messages = [...history, { role: "user", content: userText }];

  let res;
  try {
    res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages,
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error("Chave da API inválida. Confira em Ajustes.");
    if (err instanceof Anthropic.PermissionDeniedError) throw new Error("Essa chave não tem permissão para usar o Claude.");
    if (err instanceof Anthropic.RateLimitError) throw new Error("Muitos pedidos seguidos. Tente de novo em instantes.");
    if (err instanceof Anthropic.APIConnectionError) throw new Error("Sem conexão com o Claude. Confira a internet.");
    if (err instanceof Anthropic.APIError) throw new Error(`O Claude devolveu um erro (${err.status ?? "?"}). Tente de novo.`);
    throw err;
  }

  if (res.stop_reason === "refusal") throw new Error("O assistente não pôde atender esse pedido.");
  if (res.stop_reason === "max_tokens") throw new Error("A resposta ficou longa demais. Tente um pedido mais curto.");
  const textBlock = res.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("Resposta vazia. Tente de novo.");

  const data = JSON.parse(textBlock.text);
  return {
    reply: data.reply,
    operations: data.operations.filter(valid).map(clean),
    history: [...messages, { role: "assistant", content: res.content }],
  };
}

// MARK: - Validação (nunca aplicar nada fora do esperado)

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SETTING_VALUES = {
  wake: (v) => HHMM.test(v),
  shutdown: (v) => HHMM.test(v),
  deepCycles: (v) => ["1", "2"].includes(v),
  lunch: (v) => ["60", "75", "90"].includes(v),
  workout: (v) => ["45", "60", "75", "90"].includes(v),
  timerPreset: (v) => ["90/15", "25/5"].includes(v),
};

function valid(op) {
  if (op.action === "change_setting") return SETTING_VALUES[op.setting]?.(op.value) ?? false;
  if (!DATE.test(op.date) || op.date < dayKey()) return false;
  if (op.action === "add_event") return HHMM.test(op.start) && HHMM.test(op.end) && op.title.trim() !== "";
  const ids = scheduleFor(op.date).map((b) => b.id);
  if (op.action === "remove_block") return ids.includes(op.block_id);
  if (op.action === "replace_block") return ids.includes(op.block_id) && op.title.trim() !== "";
  return false;
}

let eventSeq = 0;
function clean(op) {
  const steps = op.steps.map((s) => s.trim()).filter(Boolean).slice(0, 3);
  // Eventos precisam de id próprio para poderem ser marcados como feitos.
  const id = op.action === "add_event" ? `evt-${Date.now().toString(36)}-${eventSeq++}` : "";
  return { ...op, id, title: op.title.trim(), steps };
}

/** Separa os ajustes pendentes em mudanças permanentes e por dia, para a prévia. */
export function splitOps(ops) {
  const settings = { ...state.settings };
  const byDay = {};
  for (const op of ops) {
    if (op.action === "change_setting") {
      settings[op.setting] = op.setting === "wake" || op.setting === "shutdown"
        ? Number(op.value.slice(0, 2)) * 60 + Number(op.value.slice(3))
        : /^\d+$/.test(op.value) ? Number(op.value) : op.value;
    } else {
      (byDay[op.date] ??= []).push(op);
    }
  }
  return { settings, byDay };
}

export const SETTING_LABELS = {
  wake: "Acordar", shutdown: "Desligamento", deepCycles: "Ciclos de Deep Work",
  lunch: "Almoço (min)", workout: "Treino (min)", timerPreset: "cat-modoro",
};
