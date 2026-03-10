import SwiftUI

struct PortfolioView: View {
    @State private var vm = PortfolioVM()
    @State private var showCMCImport = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                // Summary strip
                if let s = vm.summary {
                    SummaryStrip(summary: s, audUsd: vm.audUsd)
                }

                // Source filter tabs (always visible, tappable)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        SourceTab(
                            label: "All",
                            count: vm.holdings.count,
                            status: nil,
                            isSelected: vm.selectedSource == nil
                        ) { vm.selectedSource = nil }

                        SourceTab(
                            label: "Coinbase",
                            count: vm.holdings.filter { $0.source == "coinbase" }.count,
                            status: vm.sources?.coinbase,
                            isSelected: vm.selectedSource == "coinbase"
                        ) { vm.selectedSource = "coinbase" }

                        SourceTab(
                            label: "Binance",
                            count: vm.holdings.filter { $0.source == "binance" }.count,
                            status: vm.sources?.binance,
                            isSelected: vm.selectedSource == "binance"
                        ) { vm.selectedSource = "binance" }

                        SourceTab(
                            label: "Tiger",
                            count: vm.holdings.filter { $0.source == "tiger" }.count,
                            status: vm.sources?.tiger,
                            isSelected: vm.selectedSource == "tiger"
                        ) { vm.selectedSource = "tiger" }

                        SourceTab(
                            label: "Ledger",
                            count: vm.holdings.filter { $0.source == "ledger" }.count,
                            status: vm.sources?.ledger,
                            isSelected: vm.selectedSource == "ledger"
                        ) { vm.selectedSource = "ledger" }

                        SourceTab(
                            label: "CMC",
                            count: vm.holdings.filter { $0.source == "cmc" }.count,
                            status: CMCStorage.isEmpty ? nil : "ok",
                            isSelected: vm.selectedSource == "cmc"
                        ) { vm.selectedSource = "cmc" }
                    }
                    .padding(.horizontal, 2)
                }

                // Holdings list
                if vm.isLoading {
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(Theme.green)
                        Text("Loading portfolio...")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                } else if let error = vm.error {
                    Text(error)
                        .font(Theme.body)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                } else if vm.filteredHoldings.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "briefcase")
                            .font(.system(size: 40))
                            .foregroundStyle(Theme.textMuted)
                        Text(vm.selectedSource != nil ? "No \(vm.selectedSource!.capitalized) holdings" : "No holdings found")
                            .font(Theme.body)
                            .foregroundStyle(Theme.textSecondary)
                    }
                    .frame(maxWidth: .infinity, minHeight: 150)
                } else {
                    ForEach(vm.filteredHoldings) { holding in
                        HoldingRow(holding: holding)
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 12) {
                    Button {
                        showCMCImport = true
                    } label: {
                        Image(systemName: "doc.badge.plus")
                            .foregroundStyle(Theme.blue)
                    }
                    Button {
                        Task { await vm.load() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                            .foregroundStyle(Theme.green)
                    }
                }
            }
        }
        .task { await vm.load() }
        .sheet(isPresented: $showCMCImport) {
            CMCImportView {
                Task { await vm.load() }
            }
        }
    }
}

// MARK: - Source Tab

struct SourceTab: View {
    let label: String
    let count: Int
    let status: String?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                if let status {
                    Circle()
                        .fill(status == "ok" ? Theme.green : Theme.red.opacity(0.6))
                        .frame(width: 6, height: 6)
                }
                Text(label)
                    .font(Theme.caption)
                    .fontWeight(isSelected ? .semibold : .regular)
                if count > 0 {
                    Text("\(count)")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(isSelected ? Theme.green : Theme.textMuted)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(isSelected ? Theme.green.opacity(0.2) : Theme.card)
            .foregroundStyle(isSelected ? Theme.green : Theme.textSecondary)
            .clipShape(Capsule())
        }
    }
}

// MARK: - Summary Strip

struct SummaryStrip: View {
    let summary: PortfolioSummary
    let audUsd: Double

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                StatBox(label: "TOTAL", value: summary.totalValueUsd.asCurrency())
                StatBox(label: "P&L", value: summary.totalPlUsd.asCurrency(), color: summary.totalPlUsd >= 0 ? Theme.green : Theme.red)
                StatBox(label: "RETURN", value: String(format: "%+.1f%%", summary.totalPlPct), color: summary.totalPlPct >= 0 ? Theme.green : Theme.red)
            }
            HStack {
                StatBox(label: "POSITIONS", value: "\(summary.holdingCount)")
                StatBox(label: "CRYPTO", value: "\(summary.cryptoCount)")
                StatBox(label: "STOCKS", value: "\(summary.stockCount)")
            }
        }
        .cardStyle()
    }
}

struct StatBox: View {
    let label: String
    let value: String
    var color: Color = Theme.textPrimary

    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(Theme.caption)
                .foregroundStyle(Theme.textMuted)
                .textCase(.uppercase)
            Text(value)
                .font(Theme.mono)
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Holding Row

struct HoldingRow: View {
    let holding: Holding
    @State private var showTrade = false

    var body: some View {
        NavigationLink(destination: StockDetailView(sym: holding.sym, name: holding.name, priceType: holding.priceType)) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text(holding.sym)
                            .font(Theme.bodyMed)
                            .foregroundStyle(Theme.textPrimary)
                        if holding.isCrypto {
                            Image(systemName: "bitcoinsign.circle.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(Theme.amber)
                        }
                    }
                    HStack(spacing: 6) {
                        Text(holding.source.capitalized)
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                        Text("×\(holding.qty.formatted(.number.precision(.fractionLength(0...4))))")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(holding.displayValue.asCurrency())
                        .font(Theme.mono)
                        .foregroundStyle(Theme.textPrimary)
                    HStack(spacing: 4) {
                        Text(String(format: "%+.2f", holding.displayPL))
                            .font(Theme.caption)
                            .foregroundStyle(holding.displayPL >= 0 ? Theme.green : Theme.red)
                        Text("(\(String(format: "%+.1f%%", holding.displayPLpct)))")
                            .font(Theme.caption)
                            .foregroundStyle(holding.displayPL >= 0 ? Theme.green : Theme.red)
                    }
                }

                // Trade button (Ledger is read-only, no trading)
                if holding.source != "ledger" {
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
                }
            }
        }
        .buttonStyle(.plain)
        .padding(.vertical, 10)
        .padding(.horizontal, Theme.paddingMd)
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .sheet(isPresented: $showTrade) {
            TradeModal(
                sym: holding.sym,
                name: holding.name,
                priceType: holding.priceType,
                source: holding.source,
                livePrice: holding.livePrice
            )
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(Theme.caption)
                .fontWeight(isSelected ? .semibold : .regular)
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(isSelected ? Theme.green.opacity(0.2) : Theme.card)
                .foregroundStyle(isSelected ? Theme.green : Theme.textSecondary)
                .clipShape(Capsule())
        }
    }
}

// MARK: - Number formatting

extension Double {
    func asCurrency(code: String = "USD") -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = code
        formatter.maximumFractionDigits = abs(self) >= 1 ? 2 : 4
        return formatter.string(from: NSNumber(value: self)) ?? "$0.00"
    }
}
