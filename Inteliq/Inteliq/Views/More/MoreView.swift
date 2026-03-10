import SwiftUI

struct MoreView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("Features")
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)
                    .textCase(.uppercase)
                    .tracking(1.2)

                VStack(spacing: 2) {
                    NavigationLink(destination: NewsView()) {
                        MoreLink(icon: "newspaper", label: "News", color: Theme.blue)
                    }
                    NavigationLink(destination: ScreenerView()) {
                        MoreLink(icon: "text.magnifyingglass", label: "Screener", color: Theme.blue)
                    }
                    NavigationLink(destination: CoachView()) {
                        MoreLink(icon: "brain.head.profile", label: "Coach", color: Theme.green)
                    }
                    NavigationLink(destination: MacroView()) {
                        MoreLink(icon: "calendar", label: "Macro", color: Theme.amber)
                    }
                    NavigationLink(destination: EarningsView()) {
                        MoreLink(icon: "chart.bar.doc.horizontal", label: "Earnings", color: Theme.blue)
                    }
                    NavigationLink(destination: IPOView()) {
                        MoreLink(icon: "building.columns", label: "IPO", color: Theme.green)
                    }
                }

                Text("Tracking")
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)
                    .textCase(.uppercase)
                    .tracking(1.2)

                VStack(spacing: 2) {
                    NavigationLink(destination: CallsView()) {
                        MoreLink(icon: "target", label: "Calls", color: Theme.red)
                    }
                    NavigationLink(destination: JournalView()) {
                        MoreLink(icon: "book", label: "Journal", color: Theme.amber)
                    }
                    NavigationLink(destination: GlossaryView()) {
                        MoreLink(icon: "character.book.closed", label: "Glossary", color: Theme.textSecondary)
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct MoreLink: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundStyle(color)
                .frame(width: 32)
            Text(label)
                .font(Theme.body)
                .foregroundStyle(Theme.textPrimary)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12))
                .foregroundStyle(Theme.textMuted)
        }
        .padding(.vertical, 10)
        .padding(.horizontal, Theme.paddingMd)
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
