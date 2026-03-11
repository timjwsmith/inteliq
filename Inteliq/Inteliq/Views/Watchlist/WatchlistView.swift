import SwiftUI
import SwiftData

struct WatchlistView: View {
    @Query(sort: \WatchlistItem.addedAt, order: .reverse) private var items: [WatchlistItem]
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                if items.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "star")
                            .font(.system(size: 40))
                            .foregroundStyle(Theme.textMuted)
                        Text("No watchlist items yet")
                            .font(Theme.body)
                            .foregroundStyle(Theme.textSecondary)
                        Text("Search for a stock in Explorer and tap Save to Watchlist")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                } else {
                    ForEach(items) { item in
                        WatchlistRow(item: item, onDelete: { modelContext.delete(item) })
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct WatchlistRow: View {
    let item: WatchlistItem
    let onDelete: () -> Void
    @State private var showTrade = false
    @State private var offset: CGFloat = 0
    @State private var showDeleteConfirm = false

    var body: some View {
        NavigationLink(destination: StockDetailView(sym: item.sym, name: item.name, priceType: guessType(item.sym))) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.sym)
                        .font(Theme.bodyMed)
                        .foregroundStyle(Theme.textPrimary)
                    Text(item.name)
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                        .lineLimit(1)
                }
                Spacer()
                if item.targetPrice > 0 {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("TARGET")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(Theme.textMuted)
                        Text(item.targetPrice.asCurrency())
                            .font(Theme.mono)
                            .foregroundStyle(Theme.amber)
                    }
                }

                // Trade button
                Button {
                    showTrade = true
                } label: {
                    Text("TRADE")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundStyle(Theme.green)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(Theme.green.opacity(0.15))
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)

                // Delete button
                Button {
                    showDeleteConfirm = true
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(Theme.red.opacity(0.6))
                }
                .buttonStyle(.plain)
            }
        }
        .buttonStyle(.plain)
        .padding(.vertical, 8)
        .padding(.horizontal, Theme.paddingMd)
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .sheet(isPresented: $showTrade) {
            TradeModal(
                sym: item.sym,
                name: item.name,
                priceType: guessType(item.sym),
                source: nil,
                livePrice: item.targetPrice > 0 ? item.targetPrice : nil
            )
        }
        .alert("Remove from Watchlist?", isPresented: $showDeleteConfirm) {
            Button("Remove", role: .destructive) { onDelete() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Remove \(item.sym) from your watchlist?")
        }
    }

    private func guessType(_ sym: String) -> String {
        let cryptos = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "DOT", "AVAX", "MATIC", "LINK", "UNI", "ATOM"]
        return cryptos.contains(sym.uppercased()) ? "crypto" : "stock"
    }
}
