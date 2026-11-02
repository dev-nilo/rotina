// Dados da rotina e a agenda de cada dia da semana.
// Cada bloco é só uma lista de passos curtos: escanear e fazer.
// O porquê de cada coisa fica na aba Por quê (PRINCIPLES).
// Todos os horários da agenda são minutos contados a partir do despertar.

// Blocos que se repetem de segunda a sexta: [id, início, fim, título, passos].
// Horários de relógio para quem acorda 06:30 (ver buildSchedule).
const WAKE = ["wake", "06:30", "06:50", "Despertar", ["Levantar no 1º alarme", "500 ml de água", "10 min de sol, sem óculos", "Mobilidade + 60 s num pé só"]];
const MORNING = ["miracle", "06:50", "07:10", "Manhã", ["5 min de respiração lenta", "Nomear energia de 1 a 10", "Ler 1 ideia e explicar em voz alta"]];
const FOOD = ["food", "07:10", "08:00", "Café da manhã", ["30 g de proteína + gordura boa", "Café só no Deep Work"]];
const DEEP = ["deep", "08:00", "11:30", "Deep Work", ["Celular em outro cômodo", "10 min no papel: lembrar e modelar", "2 × 90 min na prioridade", "Pausa de 15 olhando longe"]];
const TRIAGE = ["triage", "11:30", "12:00", "Mensagens", ["E-mails e mensagens de uma vez", "Menos de 2 min: resolver já", "Fechar todas as abas"]];
const LUNCH = ["lunch", "12:00", "13:30", "Almoço", ["Proteína e vegetais", "15 min de sol, sem fone"]];
const VALLEY = ["valley", "13:30", "15:00", "Operacional", ["Reuniões e tarefas mecânicas", "Critérios escritos antes de decidir", "Pausa de 3 s antes de responder"]];
const EXEC = ["exec", "15:00", "17:00", "Execução", ["Executar o planejado", "16:45: prioridade de amanhã", "Deixar só esse arquivo aberto"]];
const WORKDAY = [WAKE, MORNING, FOOD, DEEP, TRIAGE, LUNCH, VALLEY, EXEC];
const train = (kind, steps) => ["train", "17:15", "18:30", `Treino · ${kind}`, steps];
const evening = (steps) => ["tribe", "18:30", "21:00", "Vida pessoal", steps];
const SUNSET = ["sunset", "21:00", "22:30", "Desacelerar", ["Luz baixa e indireta", "Sem telas", "Leitura de ficção"]];

/**
 * A semana padrão. Índice = dia da semana (0 = domingo).
 * O treino gira em volta dos jogos: perna pesada longe do Society e do Futsal (Outlive).
 */
const WEEK = [
  [
    ["wake", "07:15", "07:35", "Despertar", ["Levantar até 07:15", "500 ml de água", "10 min de sol"]],
    ["miracle", "07:35", "08:00", "Manhã", ["Silêncio e oração", "Café da manhã rápido", "Sair para o culto"]],
    ["church", "08:00", "11:00", "Culto", ["Culto matutino", "Comunhão"]],
    ["free", "11:00", "12:00", "Tempo livre", ["Voltar com calma", "Convivência"]],
    ["lunch", "12:00", "13:30", "Almoço", ["Refeição em família", "Descanso"]],
    ["rest", "13:30", "15:00", "Descanso", ["Sesta", "Ócio sem culpa"]],
    ["family", "15:00", "17:00", "Lazer e família", ["Tempo com a família", "16:45: prioridade de segunda"]],
    train("Descanso ativo", ["Caminhada longa na natureza", "Alongamento"]),
    ["church2", "19:00", "21:00", "Culto", ["Culto noturno", "Comunhão"]],
    SUNSET,
  ],
  [
    ...WORKDAY,
    train("Força superior", ["Aquecer 10 min", "Empurrar, puxar e core", "Poupar as pernas"]),
    ["tribe", "18:30", "19:30", "Vida pessoal", ["Banho", "Lanche pré-jogo", "Família"]],
    ["society", "19:30", "21:00", "Society", []],
    ["sunset", "21:00", "22:30", "Desacelerar", ["Banho morno", "Jantar leve, sem tela", "Luz baixa e indireta"]],
  ],
  [
    ...WORKDAY,
    train("Mobilidade", ["Mobilidade e estabilidade", "25 min de bike leve"]),
    evening(["Jantar com carboidrato até 19:30", "Família, sem tela"]),
    ["futsal", "21:00", "23:00", "Futsal", []],
    ["sunset", "23:00", "23:45", "Desacelerar", ["Banho morno", "5 min de respiração lenta", "Dormir"]],
  ],
  [
    // Depois do Futsal: 45 min a mais de sono, sem a Manhã, e NSDR no almoço.
    ["wake", "07:15", "07:35", "Despertar", ["Acordar 07:15, sem alarme antes", "500 ml de água", "10 min de sol, sem óculos"]],
    ["food", "07:35", "08:00", "Café da manhã", FOOD[4]],
    DEEP, TRIAGE,
    ["lunch", "12:00", "13:30", "Almoço", [...LUNCH[4], "20 min de NSDR"]],
    VALLEY, EXEC,
    train("Força", ["Aquecer 10 min", "Farmer's walk e pegada", "Posterior e core"]),
    evening(["Banho", "Jantar sem tela", "Ócio sem meta"]),
    SUNSET,
  ],
  [
    ...WORKDAY,
    train("Zona 2", ["45 min em ritmo de conversa"]),
    evening(["Banho", "Jantar sem tela", "Ócio sem meta"]),
    SUNSET,
  ],
  [
    ...WORKDAY,
    train("Força inferior", ["Aquecer 10 min", "Agachar e levantar peso", "Corpo inteiro"]),
    evening(["Banho", "Jantar sem tela", "Lazer livre"]),
    SUNSET,
  ],
  [
    ["wake", "07:15", "07:35", "Despertar", ["Levantar até 07:15", "500 ml de água", "10 min de sol", "Mobilidade"]],
    ["food", "07:35", "08:30", "Café da manhã", ["5 min de silêncio", "Café em família, com calma", "30 g de proteína"]],
    ["study", "08:30", "11:30", "Estudos", ["Celular em outro cômodo", "90 min de prática com teste", "90 min de leitura profunda"]],
    ["music", "11:30", "12:00", "Música", ["Ouvir de olhos fechados", "Seguir um só instrumento"]],
    ["lunch", "12:00", "13:30", "Almoço", ["Refeição em família, com calma", "Descanso"]],
    ["family", "13:30", "15:00", "Atividade em família", ["Passeio", "Convivência"]],
    ["hobby", "15:00", "17:00", "Hobbies", ["Hobby manual ou criativo", "Sem meta de produtividade"]],
    train("VO2 máx", ["Aquecer 10 min", "4 × 4 min forte, 4 min leve"]),
    evening(["Banho", "Jantar sem tela", "Lazer em família"]),
    SUNSET,
  ],
];
/** Despertar de referência dos horários da semana. */
const BASE_WAKE = 6 * 60 + 30;

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
 * Devolve [{ id, start, end, title, steps }] com start/end em minutos desde o despertar do ajuste,
 * por isso um dia que acorda mais tarde começa depois de 0.
 */
export function buildSchedule(weekday = 1) {
  return WEEK[weekday].map(([id, from, to, title, steps]) => ({
    id, start: parseClock(from) - BASE_WAKE, end: parseClock(to) - BASE_WAKE, title, steps,
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
