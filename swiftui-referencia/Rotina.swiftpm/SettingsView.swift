import SwiftUI

struct SettingsView: View {
    @Environment(RoutineStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    DatePicker("Acordar às", selection: wakeTime, displayedComponents: .hourAndMinute)
                    LabeledContent("Dormir às", value: Routine.clock(Routine.awakeSpan, wake: store.state.wakeMinutes))
                } footer: {
                    Text("A rotina inteira se desloca junto com o seu cronotipo. Mantenha esse horário todos os dias, com no máximo 60 min de diferença no fim de semana.")
                }

                Section {
                    Toggle("Avisar no início de cada bloco", isOn: reminders)
                }
            }
            .navigationTitle("Ajustes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                Button("OK") { dismiss() }
            }
        }
        .presentationDetents([.medium])
    }

    private var wakeTime: Binding<Date> {
        Binding {
            let w = store.state.wakeMinutes
            return Calendar.current.date(bySettingHour: w / 60, minute: w % 60, second: 0, of: .now) ?? .now
        } set: { date in
            let c = Calendar.current.dateComponents([.hour, .minute], from: date)
            store.state.wakeMinutes = (c.hour ?? 0) * 60 + (c.minute ?? 0)
            if store.state.remindersOn { Reminders.schedule(wake: store.state.wakeMinutes) }
        }
    }

    private var reminders: Binding<Bool> {
        Binding {
            store.state.remindersOn
        } set: { on in
            if on {
                Task { @MainActor in
                    store.state.remindersOn = await Reminders.enable(wake: store.state.wakeMinutes)
                }
            } else {
                Reminders.disable()
                store.state.remindersOn = false
            }
        }
    }
}
