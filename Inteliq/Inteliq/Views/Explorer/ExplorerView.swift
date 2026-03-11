import SwiftUI
import SwiftData

struct ExplorerView: View {
    @State private var vm = ExplorerVM()
    @FocusState private var searchFocused: Bool

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(Theme.textMuted)
                    TextField("Search any stock or crypto...", text: $vm.query)
                        .font(Theme.body)
                        .foregroundStyle(Theme.textPrimary)
                        .focused($searchFocused)
                        .submitLabel(.search)
                        .onSubmit {
                            searchFocused = false
                            Task { await vm.search() }
                        }
                }
                .padding(12)
                .background(Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: 10))

                // Recent searches
                if vm.result == nil && !vm.searchHistory.isEmpty {
                    Text("RECENT")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                        .tracking(1.2)

                    FlowLayout(spacing: 8) {
                        ForEach(vm.searchHistory, id: \.self) { term in
                            Button {
                                vm.query = term
                                searchFocused = false
                                Task { await vm.search() }
                            } label: {
                                Text(term)
                                    .font(Theme.caption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Theme.card)
                                    .foregroundStyle(Theme.textSecondary)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }

                // Loading
                if vm.isLoading {
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(Theme.green)
                        Text("Analysing...")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                }

                // Error
                if let error = vm.error {
                    Text(error)
                        .font(Theme.body)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                }

                // Result
                if let r = vm.result {
                    ExplorerResultCard(result: r)
                        .onAppear {
                            CallsVM.addRecord(
                                sym: r.sym,
                                name: r.name,
                                verdict: r.verdict,
                                conviction: r.conviction,
                                entryPrice: r.priceStatic ?? 0,
                                priceCurrency: r.priceCurrency ?? "USD",
                                priceType: r.priceType ?? "stock"
                            )
                        }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .scrollDismissesKeyboard(.interactively)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Result Card (Full Analysis)

struct ExplorerResultCard: View {
    let result: ExplorerResult
    @Environment(\.modelContext) private var modelContext
    @State private var showFullAnalysis = false
    @State private var savedToWatchlist = false
    @State private var showTrade = false

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 8) {
                        Text(result.sym)
                            .font(Theme.heading)
                            .foregroundStyle(Theme.textPrimary)
                        VerdictBadge(verdict: result.verdict)
                    }
                    Text(result.name)
                        .font(Theme.body)
                        .foregroundStyle(Theme.textSecondary)
                        .lineLimit(1)
                }
                Spacer()
                if let conviction = result.conviction {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(conviction)
                            .font(Theme.mono)
                            .foregroundStyle(Theme.textPrimary)
                        Text("CONVICTION")
                            .font(.system(size: 8, weight: .medium))
                            .foregroundStyle(Theme.textMuted)
                    }
                }
            }

            // Price + target
            if let price = result.priceStatic {
                HStack(spacing: 12) {
                    Text(price.formatted(.currency(code: result.priceCurrency ?? "USD")))
                        .font(Theme.mono)
                        .foregroundStyle(Theme.textPrimary)
                    if let upside = result.upside {
                        Text(upside)
                            .font(Theme.mono)
                            .foregroundStyle(result.up == true ? Theme.green : Theme.red)
                    }
                    if let target = result.target {
                        Text("→ \(target)")
                            .font(Theme.mono)
                            .foregroundStyle(Theme.amber)
                    }
                    if let horizon = result.horizon {
                        Spacer()
                        Label(horizon, systemImage: "clock")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                }
            }

            // Chart
            PriceChartView(sym: result.sym, priceType: result.priceType ?? "stock")

            // Summary
            if let summary = result.summary {
                Text(summary)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }

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
                    showFullAnalysis.toggle()
                } label: {
                    HStack(spacing: 4) {
                        Text(showFullAnalysis ? "HIDE ANALYSIS" : "FULL ANALYSIS")
                        Image(systemName: showFullAnalysis ? "chevron.up" : "chevron.down")
                    }
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(Theme.blue)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(Theme.blue.opacity(0.1))
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

            // Full analysis sections (expandable)
            if showFullAnalysis {
                VStack(alignment: .leading, spacing: 12) {
                    if let ta = result.technical {
                        AnalysisSection(title: "Technical Analysis", content: ta, icon: "chart.xyaxis.line", color: Theme.blue)
                    }
                    if let f = result.fundamental {
                        AnalysisSection(title: "Fundamentals", content: f, icon: "building.2", color: Theme.green)
                    }
                    if let m = result.macro {
                        AnalysisSection(title: "Macro Environment", content: m, icon: "globe", color: Theme.amber)
                    }
                    if let s = result.sentiment {
                        AnalysisSection(title: "Sentiment", content: s, icon: "person.3", color: Theme.blue)
                    }
                    if let i = result.insider {
                        AnalysisSection(title: "Insider Activity", content: i, icon: "person.badge.key", color: Theme.amber)
                    }
                    if let p = result.portfolio {
                        AnalysisSection(title: "Portfolio Fit", content: p, icon: "briefcase", color: Theme.green)
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .cardStyle()
        .animation(.easeInOut(duration: 0.25), value: showFullAnalysis)
        .sheet(isPresented: $showTrade) {
            TradeModal(
                sym: result.sym,
                name: result.name,
                priceType: result.priceType ?? "stock",
                source: nil,
                livePrice: result.priceStatic
            )
        }
    }

    private func saveToWatchlist() {
        guard !savedToWatchlist else { return }
        let targetPrice = result.priceStatic ?? 0
        let item = WatchlistItem(sym: result.sym, name: result.name, targetPrice: targetPrice)
        modelContext.insert(item)
        savedToWatchlist = true
    }
}

// MARK: - Analysis Section

struct AnalysisSection: View {
    let title: String
    let content: String
    var icon: String = "doc.text"
    var color: Color = Theme.textMuted

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 10))
                    .foregroundStyle(color)
                Text(title.uppercased())
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .foregroundStyle(color)
                    .tracking(0.8)
            }
            Text(content)
                .font(Theme.body)
                .foregroundStyle(Theme.textSecondary)
        }
        .padding(12)
        .background(Theme.cardAlt)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (positions: [CGPoint], size: CGSize) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (positions, CGSize(width: maxWidth, height: y + rowHeight))
    }
}
