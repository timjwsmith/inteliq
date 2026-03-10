import SwiftUI

struct CallsView: View {
    @State private var vm = CallsVM()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("AI Calls")
                    .font(Theme.headingLg)
                    .foregroundStyle(Theme.textPrimary)

                // Stats strip
                if vm.totalCalls > 0 {
                    StatsStrip(vm: vm)
                }

                // Filter pills
                FilterPills(vm: vm)

                // Loading
                if vm.isLoading && vm.livePrices.isEmpty {
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(Theme.green)
                        Text("Fetching live prices...")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: 150)
                }

                // Records list
                if vm.filteredRecords.isEmpty && !vm.isLoading {
                    EmptyCallsState(hasRecords: vm.totalCalls > 0)
                } else {
                    ForEach(vm.filteredRecords) { record in
                        CallRecordCard(record: record, vm: vm)
                    }
                }

                // Error
                if let error = vm.error {
                    Text(error)
                        .font(Theme.caption)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await vm.refresh()
        }
    }
}

// MARK: - Stats Strip

private struct StatsStrip: View {
    let vm: CallsVM

    var body: some View {
        VStack(spacing: 10) {
            // Row 1
            HStack(spacing: 10) {
                StatCell(label: "TOTAL CALLS", value: "\(vm.totalCalls)", color: Theme.textPrimary)
                StatCell(
                    label: "BUY WIN RATE",
                    value: vm.buyWinRate.map { String(format: "%.0f%%", $0) } ?? "—",
                    color: (vm.buyWinRate ?? 0) >= 50 ? Theme.green : Theme.red
                )
                StatCell(
                    label: "AVG BUY RETURN",
                    value: vm.avgBuyReturn.map { String(format: "%+.1f%%", $0) } ?? "—",
                    color: (vm.avgBuyReturn ?? 0) >= 0 ? Theme.green : Theme.red
                )
            }
            // Row 2
            HStack(spacing: 10) {
                StatCell(
                    label: "BEST BUY",
                    value: vm.bestBuy.map { "\($0.0) \(String(format: "%+.1f%%", $0.1))" } ?? "—",
                    color: Theme.green
                )
                StatCell(
                    label: "WORST BUY",
                    value: vm.worstBuy.map { "\($0.0) \(String(format: "%+.1f%%", $0.1))" } ?? "—",
                    color: Theme.red
                )
            }
        }
    }
}

private struct StatCell: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.system(size: 8, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.textMuted)
                .tracking(0.8)
            Text(value)
                .font(Theme.mono)
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

// MARK: - Filter Pills

private struct FilterPills: View {
    @Bindable var vm: CallsVM

    private let filters = ["ALL", "BUY", "WATCH", "AVOID", "HOLD"]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(filters, id: \.self) { filter in
                    let isSelected = vm.selectedFilter == filter
                    let count = vm.count(for: filter)
                    Button {
                        vm.selectedFilter = filter
                    } label: {
                        HStack(spacing: 4) {
                            Text(filter)
                            Text("\(count)")
                                .foregroundStyle(isSelected ? pillColor(filter).opacity(0.8) : Theme.textMuted)
                        }
                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(isSelected ? pillColor(filter).opacity(0.15) : Theme.card)
                        .foregroundStyle(isSelected ? pillColor(filter) : Theme.textSecondary)
                        .clipShape(Capsule())
                    }
                }
            }
        }
    }

    private func pillColor(_ filter: String) -> Color {
        switch filter {
        case "BUY": Theme.green
        case "WATCH": Theme.amber
        case "AVOID": Theme.red
        case "HOLD": Theme.blue
        default: Theme.textPrimary
        }
    }
}

// MARK: - Call Record Card

private struct CallRecordCard: View {
    let record: CallRecord
    let vm: CallsVM
    @State private var showDeleteConfirm = false

    private var returnPct: Double? { vm.returnPercent(for: record) }
    private var livePrice: Double? { vm.livePrices[record.sym] }

    var body: some View {
        NavigationLink {
            StockDetailView(sym: record.sym, name: record.name, priceType: record.priceType)
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                // Header: sym + verdict + remove
                HStack {
                    Text(record.sym)
                        .font(Theme.heading)
                        .foregroundStyle(Theme.textPrimary)
                    VerdictBadge(verdict: record.verdict)
                    Spacer()
                    if let conviction = record.conviction, !conviction.isEmpty {
                        Text(conviction)
                            .font(Theme.mono)
                            .foregroundStyle(Theme.textMuted)
                    }
                    Button {
                        showDeleteConfirm = true
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.textMuted)
                    }
                    .buttonStyle(.plain)
                }

                // Name
                Text(record.name)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
                    .lineLimit(1)

                // Date + entry price
                HStack(spacing: 12) {
                    Label(record.calledAt.formatted(.dateTime.day().month(.abbreviated).year()), systemImage: "calendar")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)

                    Text("Entry: \(record.entryPrice.formatted(.currency(code: record.priceCurrency)))")
                        .font(Theme.mono)
                        .foregroundStyle(Theme.textSecondary)
                }

                // Live price + return
                HStack(spacing: 12) {
                    if let live = livePrice {
                        Text("Now: \(live.formatted(.currency(code: record.priceCurrency)))")
                            .font(Theme.mono)
                            .foregroundStyle(Theme.textPrimary)
                    } else if vm.isLoading {
                        ProgressView()
                            .scaleEffect(0.6)
                            .tint(Theme.textMuted)
                    }

                    if let ret = returnPct {
                        Text(String(format: "%+.1f%%", ret))
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                            .foregroundStyle(ret >= 0 ? Theme.green : Theme.red)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background((ret >= 0 ? Theme.green : Theme.red).opacity(0.12))
                            .clipShape(Capsule())
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.textMuted)
                }
            }
            .cardStyle()
        }
        .buttonStyle(.plain)
        .confirmationDialog("Remove this call record?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button("Remove", role: .destructive) {
                withAnimation {
                    vm.removeRecord(sym: record.sym)
                }
            }
            Button("Cancel", role: .cancel) {}
        }
    }
}

// MARK: - Empty State

private struct EmptyCallsState: View {
    let hasRecords: Bool

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "target")
                .font(.system(size: 40))
                .foregroundStyle(Theme.green.opacity(0.5))
            Text(hasRecords ? "No Matching Calls" : "No Calls Yet")
                .font(Theme.heading)
                .foregroundStyle(Theme.textSecondary)
            Text(hasRecords
                 ? "No calls match the selected filter."
                 : "Search for a stock or crypto in Explorer to generate an AI verdict. Each analysis will be recorded here with its entry price for live return tracking."
            )
                .font(Theme.caption)
                .foregroundStyle(Theme.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .cardStyle()
    }
}
