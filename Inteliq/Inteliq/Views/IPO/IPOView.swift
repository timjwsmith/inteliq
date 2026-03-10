import SwiftUI

struct IPOView: View {
    @State private var vm = IPOVM()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("IPO Calendar")
                    .font(Theme.headingLg)
                    .foregroundStyle(Theme.textPrimary)

                Text("Upcoming and recent IPOs on NASDAQ, NYSE, ASX, and CBOE.")
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)

                // Filter pills
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(vm.filters, id: \.self) { filter in
                            FilterChip(label: filter, isSelected: vm.selectedFilter == filter) {
                                vm.selectedFilter = filter
                            }
                        }
                    }
                }

                if vm.isLoading {
                    ProgressView()
                        .tint(Theme.green)
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if let error = vm.error {
                    Text(error)
                        .font(Theme.body)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                } else if vm.filteredIPOs.isEmpty {
                    emptyState
                } else {
                    ForEach(vm.filteredIPOs) { ipo in
                        IPOCard(ipo: ipo)
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "building.columns")
                .font(.system(size: 40))
                .foregroundStyle(Theme.green.opacity(0.5))
            Text("No IPOs Found")
                .font(Theme.heading)
                .foregroundStyle(Theme.textSecondary)
            Text("No IPOs match the selected filter. Try a different category.")
                .font(Theme.caption)
                .foregroundStyle(Theme.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .cardStyle()
    }
}

// MARK: - IPO Card

private struct IPOCard: View {
    let ipo: IPOItem

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Top row: name + exchange badge
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(ipo.name ?? "Unknown Company")
                        .font(Theme.bodyMed)
                        .foregroundStyle(Theme.textPrimary)
                        .lineLimit(2)

                    if let symbol = ipo.symbol, !symbol.isEmpty {
                        Text(symbol)
                            .font(Theme.mono)
                            .foregroundStyle(Theme.textSecondary)
                    }
                }

                Spacer()

                if let exchange = ipo.exchange, !exchange.isEmpty {
                    Text(exchange)
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Theme.blue.opacity(0.2))
                        .foregroundStyle(Theme.blue)
                        .clipShape(Capsule())
                }
            }

            // Middle row: date, price range
            HStack(spacing: 16) {
                if let date = ipo.date {
                    Label(date, systemImage: "calendar")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textSecondary)
                }

                if let price = ipo.price, !price.isEmpty {
                    Label(price, systemImage: "dollarsign.circle")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textSecondary)
                }
            }

            // Bottom row: shares info + status badge
            HStack {
                if let shares = ipo.numberOfShares {
                    let formatted = formatShares(shares)
                    Text("\(formatted) shares")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                }

                if let value = ipo.totalSharesValue, value > 0 {
                    Text("$\(formatValue(value))")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                }

                Spacer()

                if let status = ipo.status, !status.isEmpty {
                    Text(status.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(statusColor(status).opacity(0.2))
                        .foregroundStyle(statusColor(status))
                        .clipShape(Capsule())
                }
            }
        }
        .cardStyle()
    }

    private func statusColor(_ status: String) -> Color {
        switch status.lowercased() {
        case "upcoming": Theme.green
        case "priced": Theme.blue
        case "filed": Theme.amber
        case "withdrawn": Theme.red
        default: Theme.textMuted
        }
    }

    private func formatShares(_ n: Double) -> String {
        if n >= 1_000_000 {
            return String(format: "%.1fM", n / 1_000_000)
        } else if n >= 1_000 {
            return String(format: "%.0fK", n / 1_000)
        }
        return String(format: "%.0f", n)
    }

    private func formatValue(_ n: Double) -> String {
        if n >= 1_000_000_000 {
            return String(format: "%.1fB", n / 1_000_000_000)
        } else if n >= 1_000_000 {
            return String(format: "%.1fM", n / 1_000_000)
        } else if n >= 1_000 {
            return String(format: "%.0fK", n / 1_000)
        }
        return String(format: "%.0f", n)
    }
}
