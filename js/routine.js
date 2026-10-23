// Dados da rotina (portados de swiftui-referencia/Rotina.swiftpm/Routine.swift)
// e o cálculo da agenda a partir dos ajustes.
// Todos os horários da agenda são minutos contados a partir do despertar.

export const LOADS = {
  none: { label: "Nula", level: 0 },
  low: { label: "Baixa", level: 1 },
  mediumLow: { label: "Média-baixa", level: 1 },
  medium: { label: "Média", level: 2 },
  mediumHigh: { label: "Média-alta", level: 3 },
  veryHigh: { label: "Muito alta", level: 4 },
  physical: { label: "Física", level: 3 },
};

export const BLOCKS = {
  wake: {
    title: "Despertar e ativação", load: "low",
    action: "Sem soneca. Empilhe os hábitos: depois de levantar, 500 ml de água; depois da água, 10 min de luz solar direta e mobilidade articular. Nada de celular.",
    why: "Corta a melatonina, dispara o pico saudável de cortisol e sincroniza o relógio biológico. Cada hábito vira o gatilho do próximo.",
    source: "Cronobiologia · Sapiens · Hábitos Atômicos",
  },
  miracle: {
    title: "Milagre da Manhã realista", load: "mediumLow",
    action: "5 min de silêncio ou respiração, 5 min de leitura, 10 min definindo a Única Coisa: o que, feito hoje, torna todo o resto mais fácil ou desnecessário?",
    why: "Começar o dia ativo e contemplativo, não reagindo às notificações dos outros.",
    source: "O Milagre da Manhã · A Única Coisa · A Sociedade do Cansaço",
  },
  food: {
    title: "Nutrição e preparação", load: "low",
    action: "Café da manhã com proteína de verdade e gordura boa. Cafeína só a partir do início do Deep Work.",
    why: "Evita picos e quedas de glicose que sabotam o córtex pré-frontal, e proteína em toda refeição preserva músculo com o passar dos anos.",
    source: "Behave · Outlive",
  },
  deep: {
    title: "Deep Work", load: "veryHigh",
    action: "Só a Única Coisa. Abra com 5 min de recuperação ativa (escreva de memória o que já sabe do problema) e trabalhe no limite da sua habilidade, buscando feedback. Celular em outro cômodo.",
    why: "Deixa (café + mesa limpa) → Rotina (monotarefa no pico do CPF) → Recompensa (pausa e caminhada curta). São essas horas de prática deliberada que se acumulam em maestria.",
    source: "Behave · O Poder do Hábito · Ultra-aprendizado · Outliers",
  },
  triage: {
    title: "Triagem e comunicação", load: "medium",
    action: "Mensagens urgentes, e-mails e pendências rápidas da equipe. Só aqui. Decisões sobre pessoas esperam por tempo e critérios escritos.",
    why: "Confinar a atenção fragmentada a uma caixa de horário específica. Pressa e cansaço deixam os vieses decidirem por você.",
    source: "A Sociedade do Cansaço · Biased",
  },
  light: {
    title: "Tarefas leves", load: "low",
    action: "Ajustes, revisões e burocracia rápida. Nada que exija criar do zero.",
    why: "O pico de foco já foi usado no Deep Work; agora é a coluna de baixa carga.",
    source: "Sistema de 3 Âncoras",
  },
  lunch: {
    title: "Almoço e descompressão", load: "none",
    action: "Refeição limpa e 15 min de caminhada ao ar livre sem fone, ou cochilo de no máximo 20 min.",
    why: "O tédio profundo de caminhar sem estímulos limpa a memória de trabalho e gera insights.",
    source: "A Sociedade do Cansaço · Sapiens",
  },
  valley: {
    title: "Vale circadiano", load: "low",
    action: "Reuniões de alinhamento, tarefas mecânicas, revisões simples, organização e burocracia.",
    why: "Respeita a queda natural de alerta depois do almoço sem forçar o CPF a criar do zero.",
    source: "Cronobiologia · Behave",
  },
  exec: {
    title: "Execução estruturada", load: "mediumHigh",
    action: "Implementar o que foi arquitetado de manhã, estudo técnico prático. Nos últimos 10 min, liste as 3 prioridades de amanhã.",
    why: "Fechar o ciclo com um ritual de encerramento cria o gatilho do dia seguinte.",
    source: "O Poder do Hábito",
  },
  train: {
    title: "Treino", load: "physical",
    action: "Alterne na semana: força 3×, zona 2 (ritmo em que ainda dá para conversar) 2–3× e um treino intenso de VO2 máx. É a transição entre o eu profissional e o pessoal.",
    why: "Hábito angular que metaboliza cortisol e libera BDNF. Força e capacidade aeróbica estão entre os maiores preditores de anos vividos com saúde.",
    source: "Sapiens · O Poder do Hábito · Outlive",
  },
  tribe: {
    title: "Vida tribal", load: "none",
    action: "Banho, jantar em família, conversa de verdade ou hobby sem pressão de performance.",
    why: "Conexão humana real e atividades que são um fim em si mesmas.",
    source: "Sapiens · A Sociedade do Cansaço",
  },
  sunset: {
    title: "Pôr do sol artificial", load: "none",
    action: "Luz amarela e indireta, zero telas de trabalho, leitura leve. Revise o dia sem culpa: o que no ambiente ajudou ou atrapalhou? Ajuste o ambiente para amanhã.",
    why: "Protege a melatonina e o sono profundo. Comportamento é produto de biologia e ambiente, então mude o ambiente em vez de cobrar mais força de vontade.",
    source: "Cronobiologia · Determined · Hábitos Atômicos",
  },
};

export const ANCHORS = [
  {
    id: "anchor1", title: "Início biológico fixo",
    detail: "Primeiros 30 min: mesmo horário (±45 min), água, luz natural, zero redes sociais e a Única Tarefa Crítica definida.",
  },
  {
    id: "anchor2", title: "Casamento energia–tarefa",
    detail: "Um bloco de 90–120 min de alta carga pela manhã, antes de abrir qualquer canal de comunicação. O resto do dia é baixa carga.",
  },
  {
    id: "anchor3", title: "Disjuntor de desligamento",
    detail: "Horário fixo: feche o computador, escreva a tarefa de amanhã num papel e vá treinar ou caminhar. Dali em diante, proibido produzir.",
  },
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
/** A vida tribal termina 14h30 depois do despertar (21:00). */
const SUNSET_START = 870;
/** Transição entre o desligamento e o treino. */
const SHUTDOWN_GAP = 15;

/** Minutos entre dois horários do relógio, sempre entre 0 e 1439. */
export function minutesBetween(from, to) {
  return (((to - from) % 1440) + 1440) % 1440;
}

/**
 * Monta a agenda do dia a partir dos ajustes.
 * Devolve [{ id, start, end, ...BLOCKS[id] }] com start/end em minutos desde o despertar.
 */
export function buildSchedule(settings) {
  const out = [];
  let t = 0;
  const push = (id, len) => {
    if (len > 0) out.push({ id, start: t, end: t + len, ...BLOCKS[id] });
    t += Math.max(0, len);
  };

  push("wake", 20);
  push("miracle", 20);
  push("food", 50);
  // 2 ciclos: 90 + 15 de pausa + 90 + 15 de caminhada. 1 ciclo: 120.
  push("deep", settings.deepCycles === 2 ? 210 : 120);
  push("triage", 30);
  push("light", LUNCH_START - t);
  push("lunch", settings.lunch);
  push("valley", 90);
  push("exec", minutesBetween(settings.wake, settings.shutdown) - t);
  t += SHUTDOWN_GAP;
  push("train", settings.workout);
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
