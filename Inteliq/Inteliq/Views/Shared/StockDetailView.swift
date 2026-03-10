import SwiftUI
import SwiftData

/// Full detail view for a stock/crypto — shown when tapping a pick or search result
struct StockDetailView: View {
    let sym: String
    let name: String
    let priceType: String

    @State private var result: ExplorerResult?
    @State private var isLoading = true
    @State private var error: String?
    @Environment(\.modelContext) private var modelContext
    @State private var savedToWatchlist = false
    @AppStorage("displayCurrency") private var currency = "AUD"
    @State private var showTrade = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(sym)
                            .font(.system(size: 28, weight: .bold))
                            .foregroundStyle(Theme.textPrimary)
                        Text(name)
                            .font(Theme.body)
                            .foregroundStyle(Theme.textSecondary)
                    }
                    Spacer()
                    if let r = result {
                        VerdictBadge(verdict: r.verdict)
                    }
                }

                // Price info
                if let r = result, let price = r.priceStatic {
                    HStack(spacing: 12) {
                        Text(price.formatted(.currency(code: r.priceCurrency ?? "USD")))
                            .font(.system(size: 20, weight: .semibold, design: .monospaced))
                            .foregroundStyle(Theme.textPrimary)
                        if let upside = r.upside {
                            Text(upside)
                                .font(Theme.mono)
                                .foregroundStyle(r.up == true ? Theme.green : Theme.red)
                        }
                        if let target = r.target {
                            Text("→ \(target)")
                                .font(Theme.mono)
                                .foregroundStyle(Theme.amber)
                        }
                    }

                    HStack(spacing: 16) {
                        if let conviction = r.conviction {
                            Label(conviction, systemImage: "gauge.high")
                        }
                        if let horizon = r.horizon {
                            Label(horizon, systemImage: "clock")
                        }
                        if let sector = r.sector {
                            Label(sector, systemImage: "building.2")
                        }
                    }
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)
                }

                // Chart
                PriceChartView(sym: sym, priceType: priceType)
                    .cardStyle()

                // Action buttons
                HStack(spacing: 10) {
                    Button {
                        showTrade = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.left.arrow.right")
                            Text("TRADE")
                        }
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(Theme.green)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(Theme.green.opacity(0.15))
                        .clipShape(Capsule())
                    }

                    Button {
                        saveToWatchlist()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: savedToWatchlist ? "star.fill" : "star")
                            Text(savedToWatchlist ? "SAVED" : "WATCHLIST")
                        }
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(savedToWatchlist ? Theme.amber : Theme.textSecondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(Theme.card)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(Theme.textMuted.opacity(0.3), lineWidth: 1))
                    }

                    Button {
                        // TODO: glossary extraction
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "character.book.closed")
                            Text("GLOSSARY")
                        }
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(Theme.green)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(Theme.green.opacity(0.1))
                        .clipShape(Capsule())
                    }
                }

                // Loading / Error / Analysis
                if isLoading {
                    VStack(spacing: 12) {
                        ProgressView().tint(Theme.green)
                        Text("Analysing...")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: 100)
                } else if let error {
                    Text(error)
                        .font(Theme.body)
                        .foregroundStyle(Theme.red)
                } else if let r = result {
                    // Summary
                    if let summary = r.summary {
                        Text(summary)
                            .font(Theme.body)
                            .foregroundStyle(Theme.textSecondary)
                            .cardStyle()
                    }

                    // Full analysis sections
                    if let ta = r.technical {
                        AnalysisSection(title: "Technical Analysis", content: ta, icon: "chart.xyaxis.line", color: Theme.blue)
                    }
                    if let f = r.fundamental {
                        AnalysisSection(title: "Fundamentals", content: f, icon: "building.2", color: Theme.green)
                    }
                    if let m = r.macro {
                        AnalysisSection(title: "Macro Environment", content: m, icon: "globe", color: Theme.amber)
                    }
                    if let s = r.sentiment {
                        AnalysisSection(title: "Sentiment", content: s, icon: "person.3", color: Theme.blue)
                    }
                    if let i = r.insider {
                        AnalysisSection(title: "Insider Activity", content: i, icon: "person.badge.key", color: Theme.amber)
                    }
                    if let p = r.portfolio {
                        AnalysisSection(title: "Portfolio Fit", content: p, icon: "briefcase", color: Theme.green)
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadAnalysis() }
        .sheet(isPresented: $showTrade) {
            TradeModal(
                sym: sym,
                name: name,
                priceType: priceType,
                source: nil,
                livePrice: result?.priceStatic
            )
        }
    }

    private func loadAnalysis() async {
        isLoading = true
        do {
            let body = SearchRequest(query: sym)
            result = try await APIService.shared.post("/api/explorer/search", body: body)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    private func saveToWatchlist() {
        guard !savedToWatchlist else { return }
        let item = WatchlistItem(sym: sym, name: name, targetPrice: result?.priceStatic ?? 0)
        modelContext.insert(item)
        savedToWatchlist = true
    }
}
