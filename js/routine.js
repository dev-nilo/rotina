// Dados da rotina e a agenda de cada dia da semana.
// Cada bloco é só uma lista de passos curtos: escanear e fazer.
// O porquê de cada coisa fica na aba Por quê (PRINCIPLES).
// Todos os horários da agenda são minutos contados a partir do despertar.

// Cada bloco: [id, início, fim, título, passos, avisa no celular?].
// Horários de relógio para quem acorda 06:30 (ver buildSchedule).
// Passos são ações concretas, no máximo 3; blocos de lazer, família, culto e jogos não têm passos.
const AVISA = true;
const WAKE = ["wake", "06:30", "07:10", "Início", ["Água e 10 min de sol", "Mobilidade + 60 s num pé só", "5 min de respiração e ler 1 ideia"], AVISA];
const FOOD = ["food", "07:10", "08:00", "Café da manhã", ["30 g de proteína", "Café só no Deep Work"]];
const DEEP = ["deep", "08:00", "11:30", "Deep Work", ["Celular em outro cômodo", "10 min no papel: lembrar e modelar", "2 × 90 min na prioridade"], AVISA];
const TRIAGE = ["triage", "11:30", "12:00", "Mensagens", ["Responder tudo de uma vez", "Menos de 2 min: resolver já", "Fechar todas as abas"], AVISA];
const LUNCH = ["lunch", "12:00", "13:30", "Almoço", ["Proteína e vegetais", "15 min de sol, sem fone"]];
const VALLEY = ["valley", "13:30", "15:00", "Operacional", ["Reuniões e tarefas mecânicas", "Critérios escritos antes de decidir", "Pausa de 3 s antes de responder"]];
const EXEC = ["exec", "15:00", "17:00", "Execução", ["Executar o planejado", "16:15: prioridade de amanhã", "Deixar só esse arquivo aberto"]];
/** Treino do fim de semana, no fim da tarde. */
const train = (kind, steps) => ["train", "17:15", "18:30", `Treino · ${kind}`, steps, AVISA];
const SUNSET = ["sunset", "21:00", "22:30", "Desacelerar", ["Luz baixa e indireta", "Sem telas", "Leitura de ficção"], AVISA];

// Dia em casa: treino das 16:30 às 17:30, logo depois da Execução.
const EXEC_HOME = ["exec", "15:00", "16:30", "Execução", ["Executar o planejado", "16:15: prioridade de amanhã", "Deixar só esse arquivo aberto"]];
const HOME_DAY = [WAKE, FOOD, DEEP, TRIAGE, LUNCH, VALLEY, EXEC_HOME];
const trainHome = (kind, steps) => ["train", "16:30", "17:30", `Treino · ${kind}`, steps, AVISA];

// Dia presencial: 15 km de bike na ida e na volta, treino do meio-dia à uma.
const BIKE_TO = ["bike", "07:20", "08:05", "Bike · ida 15 km", ["Ritmo de conversa", "Garrafa de água cheia"], AVISA];
const BIKE_BACK = ["bike2", "17:00", "17:45", "Bike · volta 15 km", ["Ritmo leve", "Lanche ao chegar"], AVISA];
const officeDay = (kind, steps, { lateWake = false } = {}) => [
  ...(lateWake
    ? [["wake", "07:00", "07:15", "Início", ["Água e 10 min de sol", "Mobilidade 5 min"], AVISA],
       ["food", "07:15", "07:35", "Café da manhã", ["30 g de proteína"]],
       ["bike", "07:35", "08:20", "Bike · ida 15 km", BIKE_TO[4], AVISA],
       ["deep", "08:20", "11:30", "Deep Work", DEEP[4], AVISA]]
    : [["wake", "06:30", "06:55", "Início", ["Água e 10 min de sol", "Mobilidade + 60 s num pé só"], AVISA],
       ["food", "06:55", "07:20", "Café da manhã", ["30 g de proteína"]],
       BIKE_TO,
       ["deep", "08:05", "11:30", "Deep Work", DEEP[4], AVISA]]),
  TRIAGE,
  ["train", "12:00", "13:00", `Treino · ${kind}`, steps, AVISA],
  ["lunch", "13:00", "13:45", "Almoço", ["Marmita: proteína e carboidrato"]],
  ["valley", "13:45", "15:00", "Operacional", VALLEY[4]],
  EXEC,
  BIKE_BACK,
];

// O treino de cada dia da semana é o mesmo nas duas semanas; muda só o horário e a bike.
// A perna fica sempre na quarta: longe do Futsal de terça e da corrida de sábado.
const TRAIN = {
  1: ["Superior A", ["Supino inclinado 3×8–10", "Remada curvada 3×8–12", "Elevação lateral 3×12–20"]],
  2: ["Leve · ombro e braço", ["Elevação lateral 3×15–20", "Rosca + tríceps 2×12", "Prancha 3×40 s"]],
  3: ["Perna", ["Agachamento livre 3×6–8", "Terra romeno 3×8", "Afundo búlgaro 3×8"]],
  4: ["Superior B", ["Barra fixa 3×6–10", "Supino reto 3×8–10", "Desenvolvimento 3×8–10"]],
  5: ["Ombro e braço", ["Desenvolvimento 3×8–12", "Elevação lateral 4×12–20", "Rosca + tríceps 3×10–12"]],
};

const ENGLISH = ["english", "19:00", "20:00", "English Club", [], AVISA];
const AFTER_ENGLISH = ["free", "20:00", "21:00", "Vida pessoal", []];
/** A noite de cada dia útil: English Club na seg, ter e qui; Futsal na terça às 21h. */
const evening = (weekday, from) => ({
  1: [["tribe", from, "19:00", "Vida pessoal", []], ENGLISH, AFTER_ENGLISH, SUNSET],
  2: [["tribe", from, "19:00", "Vida pessoal", ["Jantar com carboidrato antes do English"]], ENGLISH,
      ["free", "20:00", "21:00", "Pré-jogo", []],
      ["futsal", "21:00", "23:00", "Futsal", [], AVISA],
      ["sunset", "23:00", "23:45", "Desacelerar", ["Banho morno", "5 min de respiração lenta", "Dormir"], AVISA]],
  3: [["tribe", from, "21:00", "Vida pessoal", []], SUNSET],
  4: [["tribe", from, "19:00", "Vida pessoal", []], ENGLISH, AFTER_ENGLISH, SUNSET],
  5: [["tribe", from, "21:00", "Vida pessoal", []], SUNSET],
})[weekday];

// Quarta em casa, depois do Futsal: 45 min a mais de sono, Início curto e NSDR no almoço.
const HOME_WEDNESDAY = [
  ["wake", "07:15", "07:35", "Início", ["Água e 10 min de sol", "Mobilidade 5 min"], AVISA],
  ["food", "07:35", "08:00", "Café da manhã", FOOD[4]],
  DEEP, TRIAGE,
  ["lunch", "12:00", "13:30", "Almoço", [...LUNCH[4], "20 min de NSDR"]],
  VALLEY, EXEC_HOME,
];

const home = (wd) => [...(wd === 3 ? HOME_WEDNESDAY : HOME_DAY), trainHome(...TRAIN[wd]), ...evening(wd, "17:30")];
const office = (wd) => [...officeDay(...TRAIN[wd], { lateWake: wd === 3 }), ...evening(wd, "17:45")];

const SUNDAY = [
  ["wake", "07:15", "08:00", "Início", ["Água e 10 min de sol", "Silêncio e oração", "Café rápido"], AVISA],
  ["church", "08:00", "11:00", "Culto", [], AVISA],
  ["free", "11:00", "12:00", "Tempo livre", []],
  ["lunch", "12:00", "13:30", "Almoço", []],
  ["rest", "13:30", "15:00", "Descanso", []],
  ["family", "15:00", "17:00", "Lazer e família", ["16:15: prioridade de segunda"]],
  train("Descanso ativo", ["Caminhada longa", "Alongamento 10 min"]),
  ["church2", "19:00", "21:00", "Culto", [], AVISA],
  SUNSET,
];

const SATURDAY = [
  ["wake", "07:15", "07:35", "Início", ["Água e 10 min de sol", "Mobilidade + 60 s num pé só"], AVISA],
  ["food", "07:35", "08:30", "Café da manhã", ["30 g de proteína"]],
  ["study", "08:30", "11:30", "Estudos", ["Celular em outro cômodo", "90 min de prática com teste", "90 min de leitura profunda"], AVISA],
  ["music", "11:30", "12:00", "Música", ["Ouvir seguindo um só instrumento"]],
  ["lunch", "12:00", "13:30", "Almoço", []],
  ["family", "13:30", "15:00", "Atividade em família", []],
  ["hobby", "15:00", "17:00", "Hobbies", []],
  train("Corrida · VO2 máx", ["Aquecer 10 min", "4 × 4 min forte, 4 min leve"]),
  ["tribe", "18:30", "21:00", "Vida pessoal", []],
  SUNSET,
];

/**
 * As duas semanas, que se alternam (ver weekKind). Índice = dia da semana (0 = domingo).
 * - "tq": presencial na terça e na quinta.
 * - "sqs": presencial na segunda, na quarta e na sexta.
 */
const WEEKS = {
  tq: [SUNDAY, home(1), office(2), home(3), office(4), home(5), SATURDAY],
  sqs: [SUNDAY, office(1), home(2), office(3), home(4), office(5), SATURDAY],
};

export const WEEK_LABELS = { tq: "Presencial ter e qui", sqs: "Presencial seg, qua e sex" };

/** Semana de referência: a que começa na segunda 2026-11-16 é "tq" (ajustável em Ajustes). */
export const DEFAULT_WEEK_ANCHOR = "2026-11-16";

/** Qual das duas semanas vale para o dia `key`, dada a segunda-feira de uma semana "tq". */
export function weekKind(key, anchor = DEFAULT_WEEK_ANCHOR) {
  const day = (k) => Date.UTC(...k.split("-").map((n, i) => (i === 1 ? n - 1 : +n)));
  const monday = (k) => day(k) - ((new Date(day(k)).getUTCDay() + 6) % 7) * 86400000;
  const weeks = Math.round((monday(key) - monday(anchor)) / (7 * 86400000));
  return weeks % 2 === 0 ? "tq" : "sqs";
}

/** O dia `key` é presencial (com bike)? */
export function isOfficeDay(key, anchor = DEFAULT_WEEK_ANCHOR) {
  return WEEKS[weekKind(key, anchor)][weekdayOf(key)].some((b) => b[0] === "bike");
}

/** Despertar de referência dos horários da semana. */
const BASE_WAKE = 6 * 60 + 30;
/** Hora de definir a prioridade do dia seguinte (aviso e campo no bloco da tarde). */
export const PLAN_AT = "16:15";

export const ANCHORS = [
  { id: "anchor1", title: "Início fixo", steps: "Acordar no horário · água · sol" },
  { id: "anchor2", title: "Foco primeiro", steps: "90–120 min de alta carga antes de abrir mensagens" },
  { id: "anchor3", title: "Desligar", steps: "Definir a prioridade de amanhã · fechar o computador · treinar" },
];

export const PRINCIPLES = [
  {
    book: "Cronobiologia", author: "Till Roenneberg",
    idea: "Jet lag social: acordar 3h mais tarde no fim de semana é como trocar de fuso toda segunda-feira.",
    practice: "Mesmo horário de despertar todos os dias, com variação máxima de 45 min.",
  },
  {
    book: "O Milagre da Manhã", author: "Hal Elrod",
    idea: "A manhã ativa e intencional dá o tom do dia, mas só funciona se você dormiu 7–8h.",
    practice: "Os S.A.V.E.R.S. comprimidos em 20 minutos, sem roubar sono.",
  },
  {
    book: "Behave", author: "Robert Sapolsky",
    idea: "O córtex pré-frontal é a região mais cara do cérebro. Com fadiga ou fome, a amígdala assume.",
    practice: "O trabalho mais difícil logo depois da estabilização matinal, nunca à noite.",
  },
  {
    book: "O Poder do Hábito", author: "Charles Duhigg",
    idea: "Decidir o que fazer e quando começar gasta a energia que o foco precisaria.",
    practice: "Deixa → Rotina → Recompensa. Hábitos angulares como o treino e o ritual de início.",
  },
  {
    book: "Sapiens", author: "Yuval Noah Harari",
    idea: "Seu genoma ainda vive no Pleistoceno: luz do sol, esforço físico e tribo.",
    practice: "Sol pela manhã, músculo à tarde, gente de verdade à noite.",
  },
  {
    book: "A Sociedade do Cansaço", author: "Byung-Chul Han",
    idea: "Multitarefa é regressão, não evolução. Criar exige poder dizer não e suportar o tédio.",
    practice: "Caixas fixas para mensagens, caminhadas sem fone e janelas inegociáveis de ócio.",
  },
  {
    book: "Hábitos Atômicos", author: "James Clear",
    idea: "Você não sobe ao nível das suas metas; cai ao nível dos seus sistemas. Melhorias de 1% se acumulam.",
    practice: "Empilhe hábitos, deixe o gatilho óbvio e nunca falhe duas vezes seguidas.",
  },
  {
    book: "Ultra-aprendizado", author: "Scott H. Young",
    idea: "Aprender rápido exige prática direta e recuperação ativa, não reler e sublinhar.",
    practice: "Comece o Deep Work tentando lembrar sem consultar e busque feedback rápido.",
  },
  {
    book: "Outliers", author: "Malcolm Gladwell",
    idea: "Maestria é prática acumulada por milhares de horas, somada a oportunidade e contexto.",
    practice: "Proteja o Deep Work todos os dias: são essas horas que somam.",
  },
  {
    book: "Outlive", author: "Peter Attia",
    idea: "Viver mais e melhor depende de força, capacidade aeróbica, estabilidade e sono, muito antes de remédios.",
    practice: "Força, zona 2 e VO2 máx na semana, proteína em toda refeição e 8h de sono.",
  },
  {
    book: "Determined", author: "Robert Sapolsky",
    idea: "Nossas ações são produto de biologia e ambiente; o livre-arbítrio é bem menor do que parece.",
    practice: "Projete o ambiente em vez de confiar na força de vontade, e trate as falhas sem culpa.",
  },
  {
    book: "Biased", author: "Jennifer Eberhardt",
    idea: "Vieses implícitos agem mais sob pressa, cansaço e ambiguidade.",
    practice: "Decisões sobre pessoas: devagar, com critérios escritos antes, nunca no fim do dia.",
  },
];

/** 16h acordado, 8h de sono. */
export const AWAKE_SPAN = 16 * 60;

/** Minutos entre dois horários do relógio, sempre entre 0 e 1439. */
export function minutesBetween(from, to) {
  return (((to - from) % 1440) + 1440) % 1440;
}

/**
 * Agenda base de um dia da semana (0 = domingo).
 * Os horários da semana valem para quem acorda 06:30; mudar o despertar desloca tudo junto.
 * Devolve [{ id, start, end, title, steps, notify }] com start/end em minutos desde o despertar do ajuste,
 * por isso um dia que acorda mais tarde começa depois de 0.
 */
export function buildSchedule(weekday = 1, kind = "tq") {
  return WEEKS[kind][weekday].map(([id, from, to, title, steps, notify = false]) => ({
    id, start: parseClock(from) - BASE_WAKE, end: parseClock(to) - BASE_WAKE, title, steps, notify,
  }));
}

/** Encaixa um bloco na agenda, encurtando ou tirando os que ele cobre. */
function insert(schedule, block) {
  const { start, end } = block;
  const out = schedule.flatMap((b) => {
    if (b.end <= start || b.start >= end) return [b];
    const parts = [];
    if (b.start < start) parts.push({ ...b, end: start });
    if (b.end > end) parts.push({ ...b, id: parts.length ? `${b.id}~2` : b.id, start: end });
    return parts;
  });
  out.push(block);
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Aplica os ajustes pontuais de um dia (feitos pelo assistente) sobre a agenda base.
 * - add_event: insere um compromisso; os blocos que ele cobre são encurtados ou somem.
 * - replace_block: troca título e passos de um bloco, mantendo o horário.
 * - remove_block: tira um bloco do dia.
 * Itens alterados ganham `changed: true` para a tela destacar.
 */
export function applyOps(schedule, ops = [], wake) {
  let out = schedule.map((b) => ({ ...b }));
  for (const op of ops) {
    if (op.action === "replace_block") {
      out = out.map((b) => (b.id === op.block_id ? { ...b, title: op.title, steps: op.steps, changed: true } : b));
    } else if (op.action === "remove_block") {
      out = out.filter((b) => b.id !== op.block_id);
    } else if (op.action === "add_event") {
      const start = minutesBetween(wake, parseClock(op.start));
      let end = minutesBetween(wake, parseClock(op.end));
      if (end <= start) end = start + 60;
      out = insert(out, { id: op.id, start, end, title: op.title, steps: op.steps, changed: true, event: true });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Feriados nacionais, mais Carnaval e Corpus Christi, que costumam ser folga. Nome ou null. */
export function holidayName(key) {
  const fixed = {
    "01-01": "Confraternização Universal", "04-21": "Tiradentes", "05-01": "Dia do Trabalho",
    "09-07": "Independência", "10-12": "Nossa Senhora Aparecida", "11-02": "Finados",
    "11-15": "Proclamação da República", "11-20": "Consciência Negra", "12-25": "Natal",
  };
  if (fixed[key.slice(5)]) return fixed[key.slice(5)];
  const [y, m, d] = key.split("-").map(Number);
  const fromEaster = Math.round((Date.UTC(y, m - 1, d) - easter(y)) / 86400000);
  return { [-48]: "Carnaval", [-47]: "Carnaval", [-2]: "Sexta-feira Santa", 60: "Corpus Christi" }[fromEaster] ?? null;
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), em ms UTC. */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, n = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * n + 114) / 31), day = ((h + l - 7 * n + 114) % 31) + 1;
  return Date.UTC(y, month - 1, day);
}

/** Dia da semana (0 = domingo) de uma chave "yyyy-mm-dd". */
export function weekdayOf(key) {
  return new Date(`${key}T12:00:00`).getDay();
}

export function minutesSinceWake(date, wake) {
  return minutesBetween(wake, date.getHours() * 60 + date.getMinutes());
}

/** { kind: "block", block } | { kind: "gap", next } | { kind: "sleep" } */
export function momentAt(schedule, date, wake) {
  const m = minutesSinceWake(date, wake);
  const block = schedule.find((b) => m >= b.start && m < b.end);
  if (block) return { kind: "block", block, m };
  const next = schedule.find((b) => b.start > m);
  if (next) return { kind: "gap", next, m };
  return { kind: "sleep", m };
}

/** Horário de relógio ("HH:MM") de um ponto da agenda. */
export function clock(minutesFromWake, wake) {
  const t = (wake + minutesFromWake) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function parseClock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function duration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}`;
}
