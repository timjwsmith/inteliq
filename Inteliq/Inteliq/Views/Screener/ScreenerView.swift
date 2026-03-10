import SwiftUI

struct ScreenerView: View {
    @State private var vm = ScreenerVM()
    @FocusState private var searchFocused: Bool

    private let suggestions = [
        "Undervalued ASX small-caps",
        "High-growth US tech stocks",
        "Dividend aristocrats over 4% yield",
        "Crypto with strong momentum",
        "Defensive stocks for recession",
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("Screener")
                    .font(Theme.headingLg)
                    .foregroundStyle(Theme.textPrimary)

                // Search bar
                HStack {
                    Image(systemName: "text.magnifyingglass")
                        .foregroundStyle(Theme.textMuted)
                    TextField("Describe what you're looking for...", text: $vm.query)
                        .font(Theme.body)
                        .foregroundStyle(Theme.textPrimary)
                        .focused($searchFocused)
                        .submitLabel(.search)
                        .onSubmit {
                            searchFocused = false
                            Task { await vm.search() }
                        }
                    if !vm.query.isEmpty {
                        Button {
                            vm.query = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(Theme.textMuted)
                        }
                    }
                }
                .padding(12)
                .background(Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: 10))

                // Search button
                Button {
                    searchFocused = false
                    Task { await vm.search() }
                } label: {
                    HStack {
                        Image(systemName: "magnifyingglass")
                        Text("SCREEN")
                            .font(Theme.bodyMed)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(vm.query.trimmingCharacters(in: .whitespaces).isEmpty ? Theme.textMuted.opacity(0.3) : Theme.green)
                    .foregroundStyle(Theme.bg)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .disabled(vm.query.trimmingCharacters(in: .whitespaces).isEmpty)

                // Suggested screens
                if vm.results.isEmpty && !vm.isLoading {
                    Text("SUGGESTED SCREENS")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                        .tracking(1.2)

                    FlowLayout(spacing: 8) {
                        ForEach(suggestions, id: \.self) { suggestion in
                            Button {
                                searchFocused = false
                                Task { await vm.searchWith(suggestion) }
                            } label: {
                                Text(suggestion)
                                    .font(Theme.caption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(Theme.card)
                                    .foregroundStyle(Theme.textSecondary)
                                    .clipShape(Capsule())
                                    .overlay(
                                        Capsule().stroke(Theme.textMuted.opacity(0.3), lineWidth: 1)
                                    )
                            }
                        }
                    }
                }

                // Loading state
                if vm.isLoading {
                    VStack(spacing: 14) {
                        ProgressView()
                            .tint(Theme.green)
                            .scaleEffect(1.2)
                        Text("Screening...")
                            .font(Theme.body)
                            .foregroundStyle(Theme.textSecondary)
                        Text("AI is searching for stocks matching your criteria. This may take up to 30 seconds.")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                    .cardStyle()
                }

                // Error
                if let error = vm.error {
                    Text(error)
                        .font(Theme.body)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                }

                // Results
                if !vm.results.isEmpty {
                    HStack {
                        Text("\(vm.results.count) RESULTS")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .tracking(1.2)
                        Spacer()
                    }

                    ForEach(vm.results) { result in
                        ScreenerResultCard(result: result)
                    }
                }

                // Empty state (before any search)
                if vm.results.isEmpty && !vm.isLoading && vm.error == nil {
                    VStack(spacing: 12) {
                        Image(systemName: "text.magnifyingglass")
                            .font(.system(size: 36))
                            .foregroundStyle(Theme.green.opacity(0.4))
                        Text("Describe what you're looking for")
                            .font(Theme.body)
                            .foregroundStyle(Theme.textSecondary)
                        Text("Use natural language to find stocks matching complex criteria. Try a suggested screen or type your own query.")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 160)
                    .cardStyle()
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .scrollDismissesKeyboard(.interactively)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Screener Result Card

private struct ScreenerResultCard: View {
    let result: ScreenerResult
    @State private var showDetail = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: sym + name + verdict
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

            // Match reason
            if let reason = result.matchReason {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(Theme.green)
                    Text(reason)
                        .font(Theme.caption)
                        .foregroundStyle(Theme.green)
                }
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.green.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }

            // Price + target + upside
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
                        Text("-> \(target)")
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

            // Summary
            if let summary = result.summary {
                Text(summary)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
                    .lineLimit(3)
            }

            // Sector tag + detail link
            HStack {
                if let sector = result.sector {
                    Text(sector.uppercased())
                        .font(.system(size: 9, weight: .semibold, design: .monospaced))
                        .foregroundStyle(Theme.blue)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Theme.blue.opacity(0.12))
                        .clipShape(Capsule())
                }

                Spacer()

                NavigationLink {
                    StockDetailView(
                        sym: result.sym,
                        name: result.name,
                        priceType: result.priceType ?? "stock"
                    )
                } label: {
                    HStack(spacing: 4) {
                        Text("FULL ANALYSIS")
                        Image(systemName: "chevron.right")
                    }
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(Theme.blue)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(Theme.blue.opacity(0.1))
                    .clipShape(Capsule())
                }
            }
        }
        .cardStyle()
    }
}
