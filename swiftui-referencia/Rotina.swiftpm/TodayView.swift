import SwiftUI

struct TodayView: View {
    @Environment(RoutineStore.self) private var store
    @State private var showSettings = false
    @State private var expanded: String?

    var body: some View {
        NavigationStack {
            TimelineView(.everyMinute) { context in
                let now = context.date
                let wake = store.state.wakeMinutes

                ScrollView {
                    VStack(alignment: .leading, spacing: 32) {
                        NowCard(now: now, wake: wake)
                        FocusField()
                        if isWeekend(now, wake: wake) {
                            WeekendNote(wake: wake)
                        }
                        VStack(alignment: .leading, spacing: 0) {
                            HStack {
                                Eyebrow("Seu dia")
                                Spacer()
                                Text("\(store.doneCount(on: now)) de \(Routine.blocks.count)")
                                    .font(.caption.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.bottom, 4)
                            ForEach(Routine.blocks) { block in
                                BlockRow(block: block, wake: wake, now: now, expanded: $expanded)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 40)
                }
                .scrollDismissesKeyboard(.interactively)
                .navigationTitle(now.formatted(.dateTime.weekday(.wide).day()).capitalized)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showSettings = true } label: {
                        Image(systemName: "slider.horizontal.3")
                    }
                }
            }
            .sheet(isPresented: $showSettings) { SettingsView() }
        }
    }

    private func isWeekend(_ date: Date, wake: Int) -> Bool {
        Calendar.current.isDateInWeekend(date.addingTimeInterval(-Double(wake) * 60))
    }
}

// MARK: - Agora

private struct NowCard: View {
    let now: Date
    let wake: Int

    var body: some View {
        let m = Routine.minutesSinceWake(now, wake: wake)

        VStack(alignment: .leading, spacing: 12) {
            switch Routine.moment(at: now, wake: wake) {
            case .block(let block):
                Eyebrow("Agora", accent: true)
                Label(block.title, systemImage: block.symbol)
                    .font(.title2.weight(.semibold))
                Text(block.action)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                ProgressView(value: Double(m - block.start), total: Double(block.end - block.start))
                    .tint(.accentColor)
                    .padding(.top, 4)
                HStack {
                    Text("\(Routine.clock(block.start, wake: wake)) – \(Routine.clock(block.end, wake: wake))")
                    Spacer()
                    Text("faltam \(duration(block.end - m))")
                }
                .font(.footnote.monospacedDigit())
                .foregroundStyle(.secondary)

            case .gap(let next):
                Eyebrow("Transição", accent: true)
                Text("Respire.")
                    .font(.title2.weight(.semibold))
                Text("A seguir, \(next.title.lowercased()) às \(Routine.clock(next.start, wake: wake)).")
                    .foregroundStyle(.secondary)

            case .sleep:
                Eyebrow("Noite", accent: true)
                Label("Hora de dormir", systemImage: "bed.double")
                    .font(.title2.weight(.semibold))
                Text("Acordar às \(Routine.clock(0, wake: wake)). Oito horas de sono sustentam todo o resto.")
                    .foregroundStyle(.secondary)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground), in: .rect(cornerRadius: 24))
    }

    private func duration(_ minutes: Int) -> String {
        minutes < 60 ? "\(minutes) min" : "\(minutes / 60)h \(String(format: "%02d", minutes % 60))"
    }
}

// MARK: - Única Coisa

private struct FocusField: View {
    @Environment(RoutineStore.self) private var store

    var body: some View {
        @Bindable var store = store

        VStack(alignment: .leading, spacing: 8) {
            Eyebrow("A Única Coisa")
            TextField("O que torna o dia ganho?", text: $store.todayFocus, axis: .vertical)
                .font(.title3)
                .submitLabel(.done)
        }
    }
}

// MARK: - Fim de semana

private struct WeekendNote: View {
    let wake: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Eyebrow("Fim de semana")
            Text("Acorde até \(Routine.clock(60, wake: wake)).")
                .font(.headline)
            Text("Dormiu tarde? Mantenha o despertar, tome sol e compense com um cochilo de 20–30 min entre \(Routine.clock(390, wake: wake)) e \(Routine.clock(480, wake: wake)).")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.leading, 14)
        .overlay(alignment: .leading) {
            Capsule().fill(Color.accentColor).frame(width: 3)
        }
    }
}

// MARK: - Linha do bloco

private struct BlockRow: View {
    @Environment(RoutineStore.self) private var store
    let block: Block
    let wake: Int
    let now: Date
    @Binding var expanded: String?

    var body: some View {
        let done = store.isDone(block.id, on: now)
        let m = Routine.minutesSinceWake(now, wake: wake)
        let isNow = m >= block.start && m < block.end
        let isOpen = expanded == block.id

        HStack(alignment: .firstTextBaseline, spacing: 14) {
            Text(Routine.clock(block.start, wake: wake))
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(isNow ? Color.accentColor : .secondary)
                .frame(width: 46, alignment: .leading)

            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .firstTextBaseline) {
                    Text(block.title)
                        .fontWeight(isNow ? .semibold : .regular)
                        .strikethrough(done)
                        .foregroundStyle(done ? .secondary : .primary)
                    Spacer(minLength: 8)
                    LoadBar(load: block.load)
                }
                if isOpen {
                    Text(block.action)
                        .font(.subheadline)
                    Text(block.why)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("\(block.load.rawValue) · \(block.source)")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }
            .contentShape(.rect)
            .onTapGesture {
                withAnimation(.snappy) { expanded = isOpen ? nil : block.id }
            }

            Button {
                store.toggle(block.id, on: now)
            } label: {
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(done ? Color.accentColor : Color(.tertiaryLabel))
            }
            .buttonStyle(.plain)
            .sensoryFeedback(.success, trigger: done)
        }
        .padding(.vertical, 14)
        .overlay(alignment: .bottom) { Divider() }
    }
}

/// Quatro tracinhos que indicam a demanda cognitiva do bloco.
private struct LoadBar: View {
    let load: Load

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<4, id: \.self) { i in
                Capsule()
                    .fill(i < load.level ? Color.primary.opacity(0.55) : Color.primary.opacity(0.12))
                    .frame(width: 6, height: 3)
            }
        }
        .accessibilityLabel("Demanda \(load.rawValue)")
    }
}

// MARK: - Componentes compartilhados

struct Eyebrow: View {
    let text: String
    var accent = false

    init(_ text: String, accent: Bool = false) {
        self.text = text
        self.accent = accent
    }

    var body: some View {
        Text(text.uppercased())
            .font(.caption.weight(.semibold))
            .tracking(1.2)
            .foregroundStyle(accent ? Color.accentColor : .secondary)
    }
}
