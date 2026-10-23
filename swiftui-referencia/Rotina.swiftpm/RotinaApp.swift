import SwiftUI

@main
struct RotinaApp: App {
    @State private var store = RoutineStore()

    var body: some Scene {
        WindowGroup {
            TabView {
                TodayView()
                    .tabItem { Label("Hoje", systemImage: "sun.max") }
                AnchorsView()
                    .tabItem { Label("Âncoras", systemImage: "circle.grid.2x1") }
                PrinciplesView()
                    .tabItem { Label("Por quê", systemImage: "book") }
            }
            .environment(store)
        }
    }
}
