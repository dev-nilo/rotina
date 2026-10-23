import SwiftUI

struct PrinciplesView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 32) {
                    Text("Produtividade sustentável não vem de acordar às 5h sacrificando o sono, e sim de alinhar o trabalho mais caro do cérebro ao seu ritmo biológico.")
                        .font(.title3)

                    VStack(alignment: .leading, spacing: 0) {
                        ForEach(Principles.all) { p in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(alignment: .firstTextBaseline) {
                                    Text(p.book).font(.headline)
                                    Spacer()
                                    Text(p.author)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Text(p.idea)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                Label(p.practice, systemImage: "arrow.turn.down.right")
                                    .font(.subheadline)
                            }
                            .padding(.vertical, 18)
                            .overlay(alignment: .bottom) { Divider() }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
            }
            .navigationTitle("Por quê")
        }
    }
}
