// Dados da rotina e o cálculo da agenda a partir dos ajustes.
// Cada bloco é só uma lista de passos curtos: escanear e fazer.
// O porquê de cada coisa fica na aba Por quê (PRINCIPLES).
// Todos os horários da agenda são minutos contados a partir do despertar.

export const BLOCKS = {
  wake: { title: "Despertar", steps: ["Levantar sem soneca", "500 ml de água", "10 min de sol", "Mobilidade"] },
  miracle: { title: "Manhã", steps: ["5 min de silêncio", "5 min de leitura", "Definir a Única Coisa"] },
  food: { title: "Café da manhã", steps: ["Proteína e gordura boa", "Café só no Deep Work"] },
  deep: { title: "Deep Work", steps: ["Celular em outro cômodo", "5 min: lembrar de memória", "Só a Única Coisa"] },
  triage: { title: "Mensagens", steps: ["E-mails e mensagens", "Pendências rápidas"] },
  light: { title: "Tarefas leves", steps: ["Ajustes e revisões", "Burocracia rápida"] },
  lunch: { title: "Almoço", steps: ["Refeição limpa", "15 min de caminhada sem fone"] },
  valley: { title: "Operacional", steps: ["Reuniões", "Tarefas mecânicas"] },
  exec: { title: "Execução", steps: ["Executar o que foi planejado", "Anotar 3 prioridades de amanhã"] },
  train: { title: "Treino", steps: [] },
  tribe: { title: "Vida pessoal", steps: ["Banho", "Jantar sem tela", "Conversa ou hobby"] },
  sunset: { title: "Desacelerar", steps: ["Luz baixa", "Sem telas de trabalho", "Leitura leve"] },
};

/** Treino do dia, alternando força, zona 2 e VO2 máx (Outlive). Índice = dia da semana. */
const WORKOUTS = [
  { kind: "Descanso ativo", steps: ["Caminhada longa ao ar livre"] },
  { kind: "Força", steps: ["Aquecer 10 min", "Agachar, empurrar, puxar"] },
  { kind: "Zona 2", steps: ["45 min em ritmo de conversa"] },
  { kind: "Força", steps: ["Aquecer 10 min", "Levantar e carregar peso"] },
  { kind: "Zona 2", steps: ["45 min em ritmo de conversa"] },
  { kind: "Força", steps: ["Aquecer 10 min", "Corpo inteiro"] },
  { kind: "VO2 máx", steps: ["Aquecer 10 min", "4 × 4 min forte, 4 min leve"] },
];

export const ANCHORS = [
  { id: "anchor1", title: "Início fixo", steps: "Acordar no horário · água · sol · Única Coisa" },
  { id: "anchor2", title: "Foco primeiro", steps: "90–120 min de alta carga antes de abrir mensagens" },
  { id: "anchor3", title: "Desligar", steps: "Fechar o computador · anotar amanhã · treinar" },
];

export const PRINCIPLES = [
  {
    book: "Cronobiologia", author: "Till Roenneberg",
    idea: "Jet lag social: acordar 3h mais tarde no fim de semana é como trocar de fuso toda segunda-feira.",
    practice: "Mesmo horário de despertar todos os dias, com variação máxima de 60 min.",
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
    book: "A Única Coisa", author: "Gary Keller e Jay Papasan",
    idea: "Resultados extraordinários vêm de ir fundo numa coisa só, não de fazer várias pela metade.",
    practice: "Toda manhã: qual é a única coisa que torna o resto mais fácil ou desnecessário? Ela vai para o Deep Work.",
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
/** O almoço começa sempre 5h30 depois do despertar (12:00 para quem acorda 06:30). */
const LUNCH_START = 330;
/** A vida pessoal termina 14h30 depois do despertar (21:00). */
const SUNSET_START = 870;
/** Transição entre o desligamento e o treino. */
const SHUTDOWN_GAP = 15;

/** Minutos entre dois horários do relógio, sempre entre 0 e 1439. */
export function minutesBetween(from, to) {
  return (((to - from) % 1440) + 1440) % 1440;
}

/**
 * Monta a agenda do dia a partir dos ajustes.
 * `weekday` (0 = domingo) escolhe o treino do dia.
 * Devolve [{ id, start, end, title, steps }] com start/end em minutos desde o despertar.
 */
export function buildSchedule(settings, weekday = 1) {
  const out = [];
  let t = 0;
  const push = (id, len, extra = {}) => {
    if (len > 0) out.push({ id, start: t, end: t + len, ...BLOCKS[id], ...extra });
    t += Math.max(0, len);
  };

  push("wake", 20);
  push("miracle", 20);
  push("food", 50);
  // 2 ciclos: 90 + 15 de pausa + 90 + 15 de caminhada. 1 ciclo: 120.
  const twoCycles = settings.deepCycles === 2;
  push("deep", twoCycles ? 210 : 120, {
    steps: [...BLOCKS.deep.steps, twoCycles ? "2 × 90 min, pausa de 15" : "1 ciclo de 90–120 min"],
  });
  push("triage", 30);
  push("light", LUNCH_START - t);
  push("lunch", settings.lunch);
  push("valley", 90);
  push("exec", minutesBetween(settings.wake, settings.shutdown) - t);
  t += SHUTDOWN_GAP;
  const workout = WORKOUTS[weekday];
  push("train", settings.workout, { title: `Treino · ${workout.kind}`, steps: workout.steps });
  push("tribe", SUNSET_START - t);
  push("sunset", AWAKE_SPAN - t);
  return out;
}

/** Duração do bloco de execução; usado para avisar quando o desligamento está cedo demais. */
export function execMinutes(schedule) {
  const b = schedule.find((b) => b.id === "exec");
  return b ? b.end - b.start : 0;
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
