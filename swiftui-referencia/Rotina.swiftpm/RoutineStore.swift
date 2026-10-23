import Foundation
import Observation

struct TaskItem: Codable, Identifiable, Hashable {
    var id = UUID()
    var title: String
    var heavy: Bool
    var done = false
}

/// Tudo que o app guarda, salvo como um único JSON em UserDefaults.
struct SavedState: Codable {
    var wakeMinutes = Routine.defaultWake
    var remindersOn = false
    /// dia (yyyy-MM-dd) → ids de blocos/âncoras concluídos
    var done: [String: [String]] = [:]
    /// dia → a Única Coisa
    var focus: [String: String] = [:]
    var tasks: [TaskItem] = []
}

@Observable
final class RoutineStore {
    private static let key = "rotina.state"

    var state: SavedState {
        didSet { save() }
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: Self.key),
           let saved = try? JSONDecoder().decode(SavedState.self, from: data) {
            state = saved
        } else {
            state = SavedState()
        }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: Self.key)
        }
    }

    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    /// O "dia" começa no despertar, não à meia-noite: 01:00 ainda conta como ontem.
    func dayKey(_ date: Date) -> String {
        Self.dayFormatter.string(from: date.addingTimeInterval(-Double(state.wakeMinutes) * 60))
    }

    // MARK: Concluídos

    func isDone(_ id: String, on date: Date = .now) -> Bool {
        state.done[dayKey(date), default: []].contains(id)
    }

    func toggle(_ id: String, on date: Date = .now) {
        let key = dayKey(date)
        var ids = state.done[key, default: []]
        if let i = ids.firstIndex(of: id) { ids.remove(at: i) } else { ids.append(id) }
        state.done[key] = ids
    }

    func doneCount(on date: Date = .now) -> Int {
        let ids = Set(state.done[dayKey(date), default: []])
        return Routine.blocks.filter { ids.contains($0.id) }.count
    }

    // MARK: Única Coisa

    var todayFocus: String {
        get { state.focus[dayKey(.now), default: ""] }
        set { state.focus[dayKey(.now)] = newValue }
    }
}
