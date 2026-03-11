import SwiftUI

struct MacroView: View {
    @State private var vm = MacroVM()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("Macro Calendar")
                    .font(Theme.headingLg)
                    .foregroundStyle(Theme.textPrimary)

                if vm.isLoading {
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(Theme.green)
                        Text("Analysing macro events against your portfolio…")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                } else if let error = vm.error {
                    Text(error)
                        .font(Theme.body)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                } else if vm.events.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "calendar")
                            .font(.system(size: 40))
                            .foregroundStyle(Theme.green.opacity(0.5))
                        Text("No upcoming events")
                            .font(Theme.heading)
                            .foregroundStyle(Theme.textSecondary)
                    }
                    .frame(maxWidth: .infinity, minHeight: 200)
                    .cardStyle()
                } else {
                    ForEach(vm.events) { event in
                        MacroEventCard(event: event)
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
    }
}

// MARK: - Event Card

private struct MacroEventCard: View {
    let event: MacroEvent
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Top row: badges
            HStack(spacing: 6) {
                BadgePill(text: event.category, color: categoryColor(event.category))
                BadgePill(text: event.importance, color: importanceColor(event.importance))
                CountryBadge(country: event.country)
                Spacer()
                Text(countdown(event.date))
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundStyle(countdownColor(event.date))
            }

            // Event name + date
            Text(event.event)
                .font(Theme.heading)
                .foregroundStyle(Theme.textPrimary)

            Text(formatDate(event.date))
                .font(Theme.caption)
                .foregroundStyle(Theme.textMuted)

            // Preview
            Text(event.preview)
                .font(Theme.body)
                .foregroundStyle(Theme.textSecondary)

            // Portfolio impact
            VStack(alignment: .leading, spacing: 6) {
                Label("Portfolio Impact", systemImage: "briefcase.fill")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Theme.amber)

                Text(event.portfolioImpact)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.amber.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            // Bull / Bear cases (collapsible)
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { expanded.toggle() }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 10, weight: .bold))
                    Text(expanded ? "Hide Scenarios" : "Show Bull & Bear Cases")
                        .font(.system(size: 12, weight: .semibold))
                }
                .foregroundStyle(Theme.blue)
            }
            .buttonStyle(.plain)

            if expanded {
                VStack(alignment: .leading, spacing: 10) {
                    ScenarioRow(icon: "arrow.up.right", label: "Bull Case", text: event.bullCase, color: Theme.green)
                    ScenarioRow(icon: "arrow.down.right", label: "Bear Case", text: event.bearCase, color: Theme.red)
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            // Affected holdings
            if !event.affectedHoldings.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(event.affectedHoldings, id: \.self) { sym in
                            Text(sym)
                                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Theme.blue.opacity(0.15))
                                .foregroundStyle(Theme.blue)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
        }
        .cardStyle()
    }

    // MARK: - Category color

    private func categoryColor(_ cat: String) -> Color {
        switch cat.uppercased() {
        case "INFLATION": Theme.amber
        case "FED", "RBA", "ECB": Theme.blue
        case "EMPLOYMENT": Theme.green
        case "GROWTH": Color(hex: "#b388ff") // purple
        case "TRADE": Color(hex: "#64ffda") // teal
        default: Theme.textMuted
        }
    }

    // MARK: - Importance color

    private func importanceColor(_ imp: String) -> Color {
        switch imp.uppercased() {
        case "HIGH": Theme.red
        case "MEDIUM": Theme.amber
        case "LOW": Theme.blue
        default: Theme.textMuted
        }
    }

    // MARK: - Date helpers

    private func countdown(_ dateStr: String) -> String {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.timeZone = TimeZone(identifier: "UTC")
        guard let target = fmt.date(from: dateStr) else { return dateStr }

        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        let targetDay = cal.startOfDay(for: target)
        let days = cal.dateComponents([.day], from: today, to: targetDay).day ?? 0

        if days < 0 { return "\(-days)d ago" }
        if days == 0 { return "TODAY" }
        if days == 1 { return "Tomorrow" }
        return "in \(days)d"
    }

    private func countdownColor(_ dateStr: String) -> Color {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.timeZone = TimeZone(identifier: "UTC")
        guard let target = fmt.date(from: dateStr) else { return Theme.textMuted }

        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        let targetDay = cal.startOfDay(for: target)
        let days = cal.dateComponents([.day], from: today, to: targetDay).day ?? 0

        if days == 0 { return Theme.red }
        if days == 1 { return Theme.amber }
        if days < 0 { return Theme.textMuted }
        return Theme.green
    }

    private func formatDate(_ dateStr: String) -> String {
        let inFmt = DateFormatter()
        inFmt.dateFormat = "yyyy-MM-dd"
        inFmt.timeZone = TimeZone(identifier: "UTC")
        guard let d = inFmt.date(from: dateStr) else { return dateStr }

        let outFmt = DateFormatter()
        outFmt.dateFormat = "EEEE, d MMMM yyyy"
        return outFmt.string(from: d)
    }
}

// MARK: - Subviews

private struct BadgePill: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(color.opacity(0.2))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}

private struct CountryBadge: View {
    let country: String

    var body: some View {
        Text(flagEmoji(country) + " " + country)
            .font(.system(size: 10, weight: .semibold))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(Theme.textMuted.opacity(0.15))
            .foregroundStyle(Theme.textSecondary)
            .clipShape(Capsule())
    }

    private func flagEmoji(_ code: String) -> String {
        switch code.uppercased() {
        case "US": return "\u{1F1FA}\u{1F1F8}"
        case "AU": return "\u{1F1E6}\u{1F1FA}"
        case "EU": return "\u{1F1EA}\u{1F1FA}"
        case "CN": return "\u{1F1E8}\u{1F1F3}"
        case "JP": return "\u{1F1EF}\u{1F1F5}"
        case "UK", "GB": return "\u{1F1EC}\u{1F1E7}"
        default: return "\u{1F310}"
        }
    }
}

private struct ScenarioRow: View {
    let icon: String
    let label: String
    let text: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Label(label, systemImage: icon)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(color)
            Text(text)
                .font(Theme.body)
                .foregroundStyle(Theme.textSecondary)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
