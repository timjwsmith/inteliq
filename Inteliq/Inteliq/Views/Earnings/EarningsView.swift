import SwiftUI

struct EarningsView: View {
    @State private var vm = EarningsVM()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("Earnings Calendar")
                    .font(Theme.headingLg)
                    .foregroundStyle(Theme.textPrimary)

                if vm.isLoading {
                    ProgressView()
                        .tint(Theme.green)
                        .frame(maxWidth: .infinity, minHeight: 200)
                } else if let error = vm.error {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 32))
                            .foregroundStyle(Theme.red.opacity(0.7))
                        Text(error)
                            .font(Theme.body)
                            .foregroundStyle(Theme.red)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                    .cardStyle()
                } else if vm.upcoming.isEmpty && vm.recent.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "chart.bar.doc.horizontal")
                            .font(.system(size: 40))
                            .foregroundStyle(Theme.textMuted)
                        Text("No Earnings Data")
                            .font(Theme.heading)
                            .foregroundStyle(Theme.textSecondary)
                        Text("No upcoming or recent earnings found for your stock holdings.")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                    .cardStyle()
                } else {
                    // UPCOMING
                    if !vm.upcoming.isEmpty {
                        sectionHeader("UPCOMING", count: vm.upcoming.count)
                        ForEach(vm.upcoming) { item in
                            UpcomingEarningsCard(item: item)
                        }
                    }

                    // RECENT RESULTS
                    if !vm.recent.isEmpty {
                        sectionHeader("RECENT RESULTS", count: vm.recent.count)
                        ForEach(vm.recent) { item in
                            RecentEarningsCard(item: item)
                        }
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
    }

    private func sectionHeader(_ title: String, count: Int) -> some View {
        HStack {
            Text(title)
                .font(Theme.heading)
                .foregroundStyle(Theme.textPrimary)
            Text("\(count)")
                .font(Theme.caption)
                .foregroundStyle(Theme.textMuted)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Theme.card)
                .clipShape(Capsule())
            Spacer()
        }
        .padding(.top, 8)
    }
}

// MARK: - Upcoming Earnings Card

private struct UpcomingEarningsCard: View {
    let item: EarningsItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.symbol)
                    .font(Theme.heading)
                    .foregroundStyle(Theme.textPrimary)

                if let badge = item.timeBadge {
                    Text(badge)
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Theme.blue.opacity(0.2))
                        .foregroundStyle(Theme.blue)
                        .clipShape(Capsule())
                }

                Spacer()

                if let countdown = item.countdown {
                    Text(countdown)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(countdown == "TODAY" ? Theme.green : Theme.amber)
                }
            }

            HStack {
                Image(systemName: "calendar")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textMuted)
                Text(item.displayDate)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)

                if let est = item.epsEstimated {
                    Spacer()
                    Text("EPS Est:")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                    Text(String(format: "$%.2f", est))
                        .font(Theme.mono)
                        .foregroundStyle(Theme.textSecondary)
                }
            }

            if let revEst = item.revenueEstimated {
                HStack {
                    Text("Revenue Est:")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                    Text(formatRevenue(revEst))
                        .font(Theme.mono)
                        .foregroundStyle(Theme.textSecondary)
                }
            }
        }
        .cardStyle()
    }
}

// MARK: - Recent Earnings Card

private struct RecentEarningsCard: View {
    let item: EarningsItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.symbol)
                    .font(Theme.heading)
                    .foregroundStyle(Theme.textPrimary)

                if let badge = item.timeBadge {
                    Text(badge)
                        .font(.system(size: 10, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Theme.blue.opacity(0.2))
                        .foregroundStyle(Theme.blue)
                        .clipShape(Capsule())
                }

                Spacer()

                if let surprise = item.surprise {
                    let beat = surprise >= 0
                    Text(String(format: "%@%.1f%%", beat ? "+" : "", surprise))
                        .font(.system(size: 12, weight: .bold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background((beat ? Theme.green : Theme.red).opacity(0.2))
                        .foregroundStyle(beat ? Theme.green : Theme.red)
                        .clipShape(Capsule())
                }
            }

            HStack {
                Image(systemName: "calendar")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.textMuted)
                Text(item.displayDate)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }

            // EPS actual vs estimated
            if item.epsActual != nil || item.epsEstimated != nil {
                HStack(spacing: 16) {
                    if let actual = item.epsActual {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("EPS Actual")
                                .font(Theme.caption)
                                .foregroundStyle(Theme.textMuted)
                            Text(String(format: "$%.2f", actual))
                                .font(Theme.mono)
                                .foregroundStyle(Theme.textPrimary)
                        }
                    }
                    if let est = item.epsEstimated {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("EPS Est")
                                .font(Theme.caption)
                                .foregroundStyle(Theme.textMuted)
                            Text(String(format: "$%.2f", est))
                                .font(Theme.mono)
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
                }
            }

            // Revenue actual vs estimated
            if item.revenueActual != nil || item.revenueEstimated != nil {
                HStack(spacing: 16) {
                    if let rev = item.revenueActual {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Revenue")
                                .font(Theme.caption)
                                .foregroundStyle(Theme.textMuted)
                            Text(formatRevenue(rev))
                                .font(Theme.mono)
                                .foregroundStyle(Theme.textPrimary)
                        }
                    }
                    if let revEst = item.revenueEstimated {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Rev Est")
                                .font(Theme.caption)
                                .foregroundStyle(Theme.textMuted)
                            Text(formatRevenue(revEst))
                                .font(Theme.mono)
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
                }
            }
        }
        .cardStyle()
    }
}

// MARK: - Helpers

private func formatRevenue(_ value: Double) -> String {
    if value >= 1_000_000_000_000 {
        return String(format: "$%.1fT", value / 1_000_000_000_000)
    } else if value >= 1_000_000_000 {
        return String(format: "$%.1fB", value / 1_000_000_000)
    } else if value >= 1_000_000 {
        return String(format: "$%.1fM", value / 1_000_000)
    } else {
        return String(format: "$%.0f", value)
    }
}
