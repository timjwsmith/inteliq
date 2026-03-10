import SwiftUI

struct DashboardView: View {
    @State private var vm = DashboardVM()
    @AppStorage("displayCurrency") private var displayCurrency = "AUD"

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                // Greeting + subtitle
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(greeting).")
                        .font(Theme.headingLg)
                        .fontWeight(.bold)
                        .foregroundStyle(Theme.textPrimary)

                    if !vm.picks.isEmpty {
                        Text("\(vm.picks.count) high-conviction picks today.")
                            .font(Theme.body)
                            .foregroundStyle(Theme.textSecondary)
                    }

                    HStack(spacing: 6) {
                        Text(Date.now.formatted(.dateTime.weekday(.wide).day().month(.wide)).uppercased())
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                            .foregroundStyle(Theme.textMuted)
                        Text("·")
                            .foregroundStyle(Theme.textMuted)
                        Text("AI GENERATED")
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                            .foregroundStyle(Theme.green)
                        Text("·")
                            .foregroundStyle(Theme.textMuted)
                        Text("LIVE")
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                            .foregroundStyle(Theme.amber)
                    }
                }

                // Action buttons
                HStack(spacing: 10) {
                    ActionButton(icon: "arrow.clockwise", label: "REFRESH") {
                        Task { await vm.loadPicks(force: true) }
                    }

                    ActionButton(icon: "sparkles", label: "UPDATE GLOSSARY", color: Theme.green) {
                        // TODO: glossary update
                    }

                    Spacer()

                    // Currency toggle
                    CurrencyToggle(selected: $displayCurrency)
                }

                // Market summary
                MarketSummaryStrip()

                Text("AI-Generated Picks")
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)
                    .textCase(.uppercase)
                    .tracking(1.2)

                if vm.isLoading {
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(Theme.green)
                        Text("Generating picks...")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                } else if let error = vm.error {
                    Text(error)
                        .font(Theme.body)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                } else {
                    ForEach(vm.picks) { pick in
                        NavigationLink(destination: StockDetailView(sym: pick.sym, name: pick.name, priceType: pick.priceType ?? "stock")) {
                            PickCard(pick: pick, currency: displayCurrency)
                        }
                        .buttonStyle(.plain)
                        .onAppear {
                            CallsVM.addRecord(
                                sym: pick.sym,
                                name: pick.name,
                                verdict: pick.verdict,
                                conviction: pick.conviction,
                                entryPrice: pick.priceStatic ?? 0,
                                priceCurrency: pick.priceCurrency ?? "USD",
                                priceType: pick.priceType ?? "stock"
                            )
                        }
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.loadPicks() }
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: .now)
        switch hour {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }
}

// MARK: - Action Button

struct ActionButton: View {
    let icon: String
    let label: String
    var color: Color = Theme.textSecondary
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .semibold))
                Text(label)
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
            }
            .foregroundStyle(color)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(Theme.card)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(color.opacity(0.3), lineWidth: 1))
        }
    }
}

// MARK: - Currency Toggle

struct CurrencyToggle: View {
    @Binding var selected: String

    var body: some View {
        HStack(spacing: 0) {
            CurrencyOption(label: "USD", isSelected: selected == "USD") {
                selected = "USD"
            }
            CurrencyOption(label: "AUD", isSelected: selected == "AUD") {
                selected = "AUD"
            }
        }
        .background(Theme.card)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Theme.textMuted.opacity(0.3), lineWidth: 1))
    }
}

struct CurrencyOption: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(isSelected ? Theme.green : Color.clear)
                .foregroundStyle(isSelected ? Theme.bg : Theme.textMuted)
        }
        .clipShape(Capsule())
    }
}

// MARK: - Market Summary

struct MarketSummaryStrip: View {
    @State private var sp500: Double?
    @State private var asx200: Double?
    @State private var loaded = false

    var body: some View {
        Group {
            if loaded {
                HStack(spacing: 0) {
                    MarketTile(label: "S&P 500", change: sp500 ?? 0)
                    Rectangle()
                        .fill(Theme.textMuted.opacity(0.3))
                        .frame(width: 1, height: 30)
                    MarketTile(label: "ASX 200", change: asx200 ?? 0)
                }
                .cardStyle()
            } else {
                HStack(spacing: 8) {
                    ProgressView().tint(Theme.green).controlSize(.small)
                    Text("Loading markets...")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                }
                .frame(maxWidth: .infinity)
                .cardStyle()
            }
        }
        .task {
            do {
                let data: BenchmarkResponse = try await APIService.shared.get("/api/benchmarks")
                sp500 = data.sp500.change1d * 100
                asx200 = data.asx200.change1d * 100
            } catch {}
            loaded = true
        }
    }
}

struct MarketTile: View {
    let label: String
    let change: Double

    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(Theme.caption)
                .foregroundStyle(Theme.textSecondary)
            Text(String(format: "%+.2f%%", change))
                .font(Theme.mono)
                .fontWeight(.medium)
                .foregroundStyle(change >= 0 ? Theme.green : Theme.red)
            Text("TODAY")
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(Theme.textMuted)
        }
        .frame(maxWidth: .infinity)
    }
}

struct BenchmarkResponse: Codable {
    let sp500: IndexData
    let asx200: IndexData

    struct IndexData: Codable {
        let name: String
        let change1d: Double
        let price: Double
    }
}

// MARK: - Pick Card

struct PickCard: View {
    let pick: DashboardPick
    let currency: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(pick.sym)
                    .font(Theme.heading)
                    .foregroundStyle(Theme.textPrimary)
                Text(pick.name)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
                    .lineLimit(1)
                Spacer()
                VerdictBadge(verdict: pick.verdict)
            }

            if let price = pick.priceStatic {
                HStack(spacing: 12) {
                    Text(price.formatted(.currency(code: pick.priceCurrency ?? "USD")))
                        .font(Theme.mono)
                        .foregroundStyle(Theme.textPrimary)
                    if let upside = pick.upside {
                        Text(upside)
                            .font(Theme.mono)
                            .foregroundStyle(pick.up == true ? Theme.green : Theme.red)
                    }
                    if let target = pick.target {
                        Text("→ \(target)")
                            .font(Theme.mono)
                            .foregroundStyle(Theme.amber)
                    }
                }
            }

            Text(pick.thesis)
                .font(Theme.body)
                .foregroundStyle(Theme.textSecondary)
                .lineLimit(4)

            HStack(spacing: 16) {
                Label(pick.conviction, systemImage: "gauge.high")
                Label(pick.horizon, systemImage: "clock")
                if let sector = pick.sector {
                    Label(sector, systemImage: "building.2")
                }
            }
            .font(Theme.caption)
            .foregroundStyle(Theme.textMuted)
        }
        .cardStyle()
    }
}

// MARK: - Verdict Badge

struct VerdictBadge: View {
    let verdict: String

    var body: some View {
        Text(verdict)
            .font(Theme.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.2))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }

    private var color: Color {
        switch verdict.uppercased() {
        case "BUY", "STRONG BUY": Theme.green
        case "AVOID", "SELL": Theme.red
        default: Theme.amber
        }
    }
}
