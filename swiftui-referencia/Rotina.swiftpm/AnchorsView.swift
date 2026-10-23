import SwiftUI

/// A alternativa simples: controlar só 3 pontos fixos do dia.
struct AnchorsView: View {
    @Environment(RoutineStore.self) private var store

    private let anchors = [
        ("anchor1", "Início biológico fixo",
         "Primeiros 30 min: mesmo horário (±45 min), água, luz natural, zero redes sociais e a Única Tarefa Crítica definida."),
        ("anchor2", "Casamento energia–tarefa",
         "Um bloco de 90–120 min de alta carga pela manhã, antes de abrir qualquer canal de comunicação. O resto do dia é baixa carga."),
        ("anchor3", "Disjuntor de desligamento",
         "Horário fixo: feche o computador, escreva a tarefa de amanhã num papel e vá treinar ou caminhar. Dali em diante, proibido produzir."),
    ]

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(Array(anchors.enumerated()), id: \.offset) { index, anchor in
                        AnchorRow(number: index + 1, id: anchor.0, title: anchor.1, detail: anchor.2)
                    }
                } footer: {
                    Text("Para dias imprevisíveis: controle só esses três pontos e deixe o resto fluir. Entrega a maior parte do resultado sem planilha.")
                }

                TaskSection(heavy: true, title: "Alta carga · manhã",
                            hint: "Criar, arquitetar, problemas difíceis")
                TaskSection(heavy: false, title: "Baixa carga · tarde",
                            hint: "E-mails, reuniões, ajustes, burocracia")
            }
            .navigationTitle("3 Âncoras")
        }
    }
}

private struct AnchorRow: View {
    @Environment(RoutineStore.self) private var store
    let number: Int
    let id: String
    let title: String
    let detail: String

    var body: some View {
        let done = store.isDone(id)

        Button {
            store.toggle(id)
        } label: {
            HStack(alignment: .top, spacing: 14) {
                Text("\(number)")
                    .font(.title3.weight(.semibold).monospacedDigit())
                    .foregroundStyle(done ? Color.accentColor : .secondary)
                    .frame(width: 20)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .strikethrough(done)
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(done ? Color.accentColor : Color(.tertiaryLabel))
            }
            .padding(.vertical, 6)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.success, trigger: done)
    }
}

private struct TaskSection: View {
    @Environment(RoutineStore.self) private var store
    let heavy: Bool
    let title: String
    let hint: String
    @State private var draft = ""

    var body: some View {
        Section {
            ForEach(store.state.tasks.filter { $0.heavy == heavy }) { task in
                Button {
                    if let i = store.state.tasks.firstIndex(of: task) {
                        store.state.tasks[i].done.toggle()
                    }
                } label: {
                    HStack {
                        Image(systemName: task.done ? "checkmark.circle.fill" : "circle")
                            .foregroundStyle(task.done ? Color.accentColor : Color(.tertiaryLabel))
                        Text(task.title)
                            .strikethrough(task.done)
                            .foregroundStyle(task.done ? .secondary : .primary)
                    }
                }
                .buttonStyle(.plain)
                .swipeActions {
                    Button("Apagar", role: .destructive) {
                        store.state.tasks.removeAll { $0.id == task.id }
                    }
                }
            }
            TextField("Adicionar", text: $draft)
                .submitLabel(.done)
                .onSubmit(add)
        } header: {
            Text(title)
        } footer: {
            Text(hint)
        }
    }

    private func add() {
        let title = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }
        store.state.tasks.append(TaskItem(title: title, heavy: heavy))
        draft = ""
    }
}
