import Foundation

/// Demanda cognitiva de cada bloco.
enum Load: String {
    case none = "Nula"
    case low = "Baixa"
    case mediumLow = "Média-baixa"
    case medium = "Média"
    case mediumHigh = "Média-alta"
    case veryHigh = "Muito alta"
    case physical = "Física"

    /// 0...4, usado para desenhar a barrinha de intensidade.
    var level: Int {
        switch self {
        case .none: 0
        case .low: 1
        case .mediumLow: 1
        case .medium: 2
        case .mediumHigh: 3
        case .veryHigh: 4
        case .physical: 3
        }
    }
}

/// Um bloco do dia. Horários são minutos contados a partir do despertar,
/// para que a rotina inteira se desloque junto com o seu cronotipo.
struct Block: Identifiable {
    let id: String
    let start: Int
    let end: Int
    let title: String
    let symbol: String
    let load: Load
    let action: String
    let why: String
    let source: String
}

enum Routine {
    /// Horário padrão de despertar (06:30), em minutos desde a meia-noite.
    static let defaultWake = 6 * 60 + 30
    /// Duração do período acordado: 16h, dormindo 8h.
    static let awakeSpan = 16 * 60

    static let blocks: [Block] = [
        Block(id: "wake", start: 0, end: 20,
              title: "Despertar e ativação",
              symbol: "sun.horizon",
              load: .low,
              action: "Sem soneca. 500 ml de água, 10 min de luz solar direta e mobilidade articular. Nada de celular.",
              why: "Corta a melatonina, dispara o pico saudável de cortisol e sincroniza o relógio biológico.",
              source: "Cronobiologia · Sapiens"),
        Block(id: "miracle", start: 20, end: 40,
              title: "Milagre da Manhã realista",
              symbol: "leaf",
              load: .mediumLow,
              action: "5 min de silêncio ou respiração, 5 min de leitura, 10 min definindo a Única Coisa que torna o dia ganho.",
              why: "Começar o dia ativo e contemplativo, não reagindo às notificações dos outros.",
              source: "O Milagre da Manhã · A Sociedade do Cansaço"),
        Block(id: "food", start: 40, end: 90,
              title: "Nutrição e preparação",
              symbol: "fork.knife",
              load: .low,
              action: "Café da manhã rico em proteína e gordura boa. Cafeína só a partir do início do Deep Work.",
              why: "Evita picos e quedas de glicose que sabotam o córtex pré-frontal no meio da manhã.",
              source: "Behave"),
        Block(id: "deep", start: 90, end: 300,
              title: "Deep Work",
              symbol: "brain.head.profile",
              load: .veryHigh,
              action: "2 ciclos de 90 min com 15 min de pausa real. Só o problema mais difícil do dia. Celular em outro cômodo.",
              why: "Deixa (café + mesa limpa) → Rotina (monotarefa no pico do CPF) → Recompensa (pausa e caminhada curta).",
              source: "Behave · O Poder do Hábito"),
        Block(id: "triage", start: 300, end: 330,
              title: "Triagem e comunicação",
              symbol: "tray",
              load: .medium,
              action: "Mensagens urgentes, e-mails e pendências rápidas da equipe. Só aqui.",
              why: "Confinar a atenção fragmentada a uma caixa de horário específica.",
              source: "A Sociedade do Cansaço"),
        Block(id: "lunch", start: 330, end: 420,
              title: "Almoço e descompressão",
              symbol: "figure.walk",
              load: .none,
              action: "Refeição limpa e 15 min de caminhada ao ar livre sem fone, ou cochilo de no máximo 20 min.",
              why: "O tédio profundo de caminhar sem estímulos limpa a memória de trabalho e gera insights.",
              source: "A Sociedade do Cansaço · Sapiens"),
        Block(id: "valley", start: 420, end: 510,
              title: "Vale circadiano",
              symbol: "cloud",
              load: .low,
              action: "Reuniões de alinhamento, tarefas mecânicas, revisões simples, organização e burocracia.",
              why: "Respeita a queda natural de alerta depois do almoço sem forçar o CPF a criar do zero.",
              source: "Cronobiologia · Behave"),
        Block(id: "exec", start: 510, end: 630,
              title: "Execução estruturada",
              symbol: "hammer",
              load: .mediumHigh,
              action: "Implementar o que foi arquitetado de manhã, estudo técnico prático. Nos últimos 10 min, liste as 3 prioridades de amanhã.",
              why: "Fechar o ciclo com um ritual de encerramento cria o gatilho do dia seguinte.",
              source: "O Poder do Hábito"),
        Block(id: "train", start: 645, end: 720,
              title: "Treino",
              symbol: "figure.run",
              load: .physical,
              action: "Musculação, corrida ou esporte coletivo. A transição entre o eu profissional e o pessoal.",
              why: "Hábito angular que metaboliza cortisol e adrenalina e libera BDNF.",
              source: "Sapiens · O Poder do Hábito"),
        Block(id: "tribe", start: 720, end: 870,
              title: "Vida tribal",
              symbol: "person.2",
              load: .none,
              action: "Banho, jantar em família, conversa de verdade ou hobby sem pressão de performance.",
              why: "Conexão humana real e atividades que são um fim em si mesmas.",
              source: "Sapiens · A Sociedade do Cansaço"),
        Block(id: "sunset", start: 870, end: 960,
              title: "Pôr do sol artificial",
              symbol: "moon",
              load: .none,
              action: "Luz amarela e indireta, zero telas de trabalho, leitura leve. Prepare o quarto para dormir.",
              why: "Protege a melatonina e a arquitetura do sono profundo e REM.",
              source: "Cronobiologia"),
    ]

    enum Moment {
        case block(Block)
        case gap(next: Block)
        case sleep
    }

    /// Minutos desde o despertar, sempre entre 0 e 1439.
    static func minutesSinceWake(_ date: Date, wake: Int) -> Int {
        let c = Calendar.current.dateComponents([.hour, .minute], from: date)
        let now = (c.hour ?? 0) * 60 + (c.minute ?? 0)
        return ((now - wake) % 1440 + 1440) % 1440
    }

    static func moment(at date: Date, wake: Int) -> Moment {
        let m = minutesSinceWake(date, wake: wake)
        if let b = blocks.first(where: { m >= $0.start && m < $0.end }) { return .block(b) }
        if let next = blocks.first(where: { $0.start > m }) { return .gap(next: next) }
        return .sleep
    }

    static func clock(_ minutesSinceWake: Int, wake: Int) -> String {
        let t = (wake + minutesSinceWake) % 1440
        return String(format: "%02d:%02d", t / 60, t % 60)
    }
}

struct Principle: Identifiable {
    var id: String { book }
    let book: String
    let author: String
    let idea: String
    let practice: String
}

enum Principles {
    static let all: [Principle] = [
        Principle(book: "Cronobiologia", author: "Till Roenneberg",
                  idea: "Jet lag social: acordar 3h mais tarde no fim de semana é como trocar de fuso toda segunda-feira.",
                  practice: "Mesmo horário de despertar todos os dias, com variação máxima de 60 min."),
        Principle(book: "O Milagre da Manhã", author: "Hal Elrod",
                  idea: "A manhã ativa e intencional dá o tom do dia — mas só funciona se você dormiu 7–8h.",
                  practice: "Os S.A.V.E.R.S. comprimidos em 20 minutos, sem roubar sono."),
        Principle(book: "Behave", author: "Robert Sapolsky",
                  idea: "O córtex pré-frontal é a região mais cara do cérebro. Com fadiga ou fome, a amígdala assume.",
                  practice: "O trabalho mais difícil logo depois da estabilização matinal, nunca à noite."),
        Principle(book: "O Poder do Hábito", author: "Charles Duhigg",
                  idea: "Decidir o que fazer e quando começar gasta a energia que o foco precisaria.",
                  practice: "Deixa → Rotina → Recompensa. Hábitos angulares como o treino e o ritual de início."),
        Principle(book: "Sapiens", author: "Yuval Noah Harari",
                  idea: "Seu genoma ainda vive no Pleistoceno: luz do sol, esforço físico e tribo.",
                  practice: "Sol pela manhã, músculo à tarde, gente de verdade à noite."),
        Principle(book: "A Sociedade do Cansaço", author: "Byung-Chul Han",
                  idea: "Multitarefa é regressão, não evolução. Criar exige poder dizer não e suportar o tédio.",
                  practice: "Caixas fixas para mensagens, caminhadas sem fone e janelas inegociáveis de ócio."),
    ]
}
