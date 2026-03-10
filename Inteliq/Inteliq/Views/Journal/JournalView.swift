import SwiftUI

struct JournalView: View {
    @State private var vm = JournalVM()
    @State private var showForm = false
    @State private var closingTradeID: UUID?
    @State private var closePrice = ""
    @State private var deletingTradeID: UUID?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("Trade Journal")
                    .font(Theme.headingLg)
                    .foregroundStyle(Theme.textPrimary)

                Text("Log your buy and sell entries and let the AI identify behavioural patterns, recurring mistakes, and strengths in your trading over time.")
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)

                // MARK: - Log Trade Form
                logTradeSection

                // MARK: - AI Analysis
                if vm.canAnalyse {
                    analysisSection
                }

                // MARK: - Error
                if let error = vm.error {
                    Text(error)
                        .font(Theme.caption)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                }

                // MARK: - Trade Log
                tradeLogSection
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .alert("Close Trade", isPresented: .init(
            get: { closingTradeID != nil },
            set: { if !$0 { closingTradeID = nil; closePrice = "" } }
        )) {
            TextField("Exit price", text: $closePrice)
                .keyboardType(.decimalPad)
            Button("Close Trade") {
                if let id = closingTradeID, let price = Double(closePrice), price > 0 {
                    vm.closeTrade(id: id, exitPrice: price)
                }
                closingTradeID = nil
                closePrice = ""
            }
            Button("Cancel", role: .cancel) {
                closingTradeID = nil
                closePrice = ""
            }
        } message: {
            Text("Enter the exit price for this trade.")
        }
        .alert("Delete Trade", isPresented: .init(
            get: { deletingTradeID != nil },
            set: { if !$0 { deletingTradeID = nil } }
        )) {
            Button("Delete", role: .destructive) {
                if let id = deletingTradeID {
                    vm.deleteEntry(id: id)
                }
                deletingTradeID = nil
            }
            Button("Cancel", role: .cancel) {
                deletingTradeID = nil
            }
        } message: {
            Text("Are you sure you want to delete this trade entry?")
        }
    }

    // MARK: - Log Trade Section

    private var logTradeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                withAnimation(.easeInOut(duration: 0.25)) {
                    showForm.toggle()
                }
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .foregroundStyle(Theme.green)
                    Text("LOG TRADE")
                        .font(Theme.bodyMed)
                        .foregroundStyle(Theme.textPrimary)
                    Spacer()
                    Image(systemName: showForm ? "chevron.up" : "chevron.down")
                        .foregroundStyle(Theme.textMuted)
                        .font(.system(size: 14))
                }
            }

            if showForm {
                VStack(spacing: 14) {
                    // Date
                    HStack {
                        Text("DATE")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .frame(width: 70, alignment: .leading)
                        DatePicker("", selection: $vm.formDate, displayedComponents: .date)
                            .labelsHidden()
                            .tint(Theme.green)
                            .colorScheme(.dark)
                    }

                    // Symbol
                    HStack {
                        Text("SYMBOL")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .frame(width: 70, alignment: .leading)
                        TextField("e.g. AAPL, BTC", text: $vm.formSym)
                            .font(Theme.body)
                            .foregroundStyle(Theme.textPrimary)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Theme.bg)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Action toggle
                    HStack {
                        Text("ACTION")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .frame(width: 70, alignment: .leading)
                        HStack(spacing: 0) {
                            actionToggleButton("BUY", color: Theme.green)
                            actionToggleButton("SELL", color: Theme.red)
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Qty
                    HStack {
                        Text("QTY")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .frame(width: 70, alignment: .leading)
                        TextField("Quantity", text: $vm.formQty)
                            .font(Theme.body)
                            .foregroundStyle(Theme.textPrimary)
                            .keyboardType(.decimalPad)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Theme.bg)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Price
                    HStack {
                        Text("PRICE")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .frame(width: 70, alignment: .leading)
                        TextField("Entry price", text: $vm.formPrice)
                            .font(Theme.body)
                            .foregroundStyle(Theme.textPrimary)
                            .keyboardType(.decimalPad)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Theme.bg)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Currency
                    HStack {
                        Text("CCY")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .frame(width: 70, alignment: .leading)
                        HStack(spacing: 0) {
                            currencyToggleButton("USD")
                            currencyToggleButton("AUD")
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Thesis
                    VStack(alignment: .leading, spacing: 4) {
                        Text("THESIS")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                        TextField("Why are you making this trade?", text: $vm.formThesis, axis: .vertical)
                            .font(Theme.body)
                            .foregroundStyle(Theme.textPrimary)
                            .lineLimit(3...6)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Theme.bg)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Submit
                    Button {
                        vm.addEntry()
                        withAnimation { showForm = false }
                    } label: {
                        HStack {
                            Image(systemName: "square.and.pencil")
                            Text("LOG TRADE")
                                .font(Theme.bodyMed)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(vm.formSym.isEmpty ? Theme.green.opacity(0.4) : Theme.green)
                        .foregroundStyle(Theme.bg)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(vm.formSym.isEmpty)
                }
            }
        }
        .cardStyle()
    }

    private func actionToggleButton(_ label: String, color: Color) -> some View {
        Button {
            vm.formAction = label
        } label: {
            Text(label)
                .font(Theme.bodyMed)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(vm.formAction == label ? color : Theme.bg)
                .foregroundStyle(vm.formAction == label ? Theme.bg : Theme.textSecondary)
        }
    }

    private func currencyToggleButton(_ label: String) -> some View {
        Button {
            vm.formCurrency = label
        } label: {
            Text(label)
                .font(Theme.bodyMed)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(vm.formCurrency == label ? Theme.blue : Theme.bg)
                .foregroundStyle(vm.formCurrency == label ? Theme.bg : Theme.textSecondary)
        }
    }

    // MARK: - Analysis Section

    private var analysisSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if vm.isAnalysing {
                analysisLoading
            } else if let analysis = vm.analysis {
                analysisResult(analysis)
            } else {
                analyseButton
            }
        }
    }

    private var analyseButton: some View {
        Button {
            Task { await vm.analyse() }
        } label: {
            HStack {
                Image(systemName: "brain.head.profile")
                Text("ANALYSE PATTERNS")
                    .font(Theme.bodyMed)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Theme.green)
            .foregroundStyle(Theme.bg)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
    }

    private var analysisLoading: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(Theme.green)
                .scaleEffect(1.2)
            Text("Analysing trading patterns...")
                .font(Theme.bodyMed)
                .foregroundStyle(Theme.textSecondary)
        }
        .frame(maxWidth: .infinity, minHeight: 160)
        .cardStyle()
    }

    @ViewBuilder
    private func analysisResult(_ a: JournalAnalysis) -> some View {
        // Re-run button
        Button {
            Task { await vm.analyse() }
        } label: {
            HStack {
                Image(systemName: "arrow.clockwise")
                Text("RE-ANALYSE")
                    .font(Theme.bodyMed)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(Theme.card)
            .foregroundStyle(Theme.green)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Theme.green.opacity(0.4), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }

        // Stats row
        if a.winRate != nil || a.topMistake != nil {
            HStack(spacing: 12) {
                if let wr = a.winRate {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("WIN RATE")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                        Text("\(Int(wr))%")
                            .font(Theme.heading)
                            .foregroundStyle(wr >= 50 ? Theme.green : Theme.red)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .cardStyle()
                }
                if let mistake = a.topMistake {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("TOP MISTAKE")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                        Text(mistake)
                            .font(Theme.bodyMed)
                            .foregroundStyle(Theme.amber)
                            .lineLimit(2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .cardStyle()
                }
            }
        }

        // Summary
        VStack(alignment: .leading, spacing: 8) {
            Text("Summary")
                .font(Theme.heading)
                .foregroundStyle(Theme.textPrimary)
            Text(a.summary)
                .font(Theme.body)
                .foregroundStyle(Theme.textSecondary)
        }
        .cardStyle()

        // Key Advice (highlighted)
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "lightbulb.fill")
                    .foregroundStyle(Theme.amber)
                Text("Key Advice")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.amber)
            }
            Text(a.keyAdvice)
                .font(Theme.body)
                .foregroundStyle(Theme.textPrimary)
        }
        .padding(Theme.paddingMd)
        .background(Theme.amber.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cornerRadius)
                .stroke(Theme.amber.opacity(0.3), lineWidth: 1)
        )

        // Behavioural Patterns
        if !a.patterns.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text("Behavioural Patterns")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.textPrimary)

                ForEach(a.patterns) { pattern in
                    patternRow(pattern)
                }
            }
            .cardStyle()
        }
    }

    private func patternRow(_ p: BehaviourPattern) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(p.name)
                    .font(Theme.bodyMed)
                    .foregroundStyle(Theme.textPrimary)
                Spacer()
                Text(p.severity)
                    .font(Theme.caption)
                    .foregroundStyle(Theme.bg)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(severityColor(p.severity))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            }
            Text(p.description)
                .font(Theme.caption)
                .foregroundStyle(Theme.textSecondary)
            HStack(alignment: .top, spacing: 4) {
                Image(systemName: "arrow.turn.down.right")
                    .font(.system(size: 10))
                    .foregroundStyle(Theme.blue)
                    .padding(.top, 2)
                Text(p.advice)
                    .font(Theme.caption)
                    .foregroundStyle(Theme.blue)
            }
        }
        .padding(10)
        .background(Theme.bg.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Trade Log Section

    private var tradeLogSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if vm.entries.isEmpty {
                emptyState
            } else {
                Text("Trade Log")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.textPrimary)

                Text("\(vm.entries.count) entries")
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)

                ForEach(vm.entries) { entry in
                    tradeRow(entry)
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "book")
                .font(.system(size: 40))
                .foregroundStyle(Theme.green.opacity(0.5))
            Text("No Entries Yet")
                .font(Theme.heading)
                .foregroundStyle(Theme.textSecondary)
            Text("Tap \"Log Trade\" above to record your first buy or sell entry. After 3+ entries you can run AI pattern analysis.")
                .font(Theme.caption)
                .foregroundStyle(Theme.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .cardStyle()
    }

    private func tradeRow(_ entry: JournalEntry) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            // Top row: badge, symbol, date
            HStack {
                Text(entry.action)
                    .font(Theme.caption)
                    .foregroundStyle(Theme.bg)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(entry.action == "BUY" ? Theme.green : Theme.red)
                    .clipShape(RoundedRectangle(cornerRadius: 6))

                Text(entry.sym)
                    .font(Theme.bodyMed)
                    .foregroundStyle(Theme.textPrimary)

                Spacer()

                Text(entry.date, style: .date)
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)
            }

            // Details: qty x price
            HStack {
                Text("\(formatQty(entry.qty)) x \(entry.currency) \(formatPrice(entry.price))")
                    .font(Theme.mono)
                    .foregroundStyle(Theme.textSecondary)
                Spacer()
                Text("= \(entry.currency) \(formatPrice(entry.qty * entry.price))")
                    .font(Theme.mono)
                    .foregroundStyle(Theme.textSecondary)
            }

            // Thesis
            if !entry.thesis.isEmpty {
                Text(entry.thesis)
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)
                    .lineLimit(2)
            }

            // Closed trade: show return
            if entry.isClosed, let ret = entry.returnPct {
                HStack {
                    Text("CLOSED")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                    if let exitDate = entry.exitDate {
                        Text(exitDate, style: .date)
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    Text("@ \(entry.currency) \(formatPrice(entry.exitPrice ?? 0))")
                        .font(Theme.mono)
                        .foregroundStyle(Theme.textSecondary)
                    Spacer()
                    Text(String(format: "%+.1f%%", ret))
                        .font(Theme.bodyMed)
                        .foregroundStyle(ret >= 0 ? Theme.green : Theme.red)
                }
            }

            // Actions for open trades
            if !entry.isClosed {
                HStack(spacing: 12) {
                    Button {
                        closingTradeID = entry.id
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.circle")
                                .font(.system(size: 12))
                            Text("CLOSE TRADE")
                                .font(Theme.caption)
                        }
                        .foregroundStyle(Theme.amber)
                    }

                    Spacer()

                    Button {
                        deletingTradeID = entry.id
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.red.opacity(0.7))
                    }
                }
            } else {
                HStack {
                    Spacer()
                    Button {
                        deletingTradeID = entry.id
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.red.opacity(0.7))
                    }
                }
            }
        }
        .cardStyle()
    }

    // MARK: - Helpers

    private func severityColor(_ severity: String) -> Color {
        switch severity.uppercased() {
        case "HIGH": return Theme.red
        case "MEDIUM": return Theme.amber
        default: return Theme.blue
        }
    }

    private func formatPrice(_ value: Double) -> String {
        String(format: value >= 1 ? "%.2f" : "%.4f", value)
    }

    private func formatQty(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0
            ? String(format: "%.0f", value)
            : String(format: "%.4f", value)
    }
}
