import SwiftUI

struct NewsView: View {
    @State private var vm = NewsVM()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                // Category filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(vm.categories, id: \.self) { cat in
                            FilterChip(label: cat, isSelected: vm.selectedCategory == cat) {
                                vm.selectedCategory = cat
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
                } else {
                    ForEach(vm.filteredArticles) { article in
                        NewsRow(article: article)
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

struct NewsRow: View {
    let article: NewsItem

    var body: some View {
        Link(destination: URL(string: article.link) ?? URL(string: "about:blank")!) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    if let sentiment = article.sentiment {
                        Text(sentiment)
                            .font(.system(size: 10, weight: .bold))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(sentimentColor(sentiment).opacity(0.2))
                            .foregroundStyle(sentimentColor(sentiment))
                            .clipShape(Capsule())
                    }
                    if let impact = article.impact {
                        Text(impact)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(Theme.textMuted)
                    }
                    Spacer()
                    if let tag = article.tag {
                        Text(tag)
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                }

                Text(article.headline)
                    .font(Theme.bodyMed)
                    .foregroundStyle(Theme.textPrimary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                if let time = article.time {
                    Text(time)
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                }
            }
            .padding(.vertical, 8)
            .padding(.horizontal, Theme.paddingMd)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }

    private func sentimentColor(_ s: String) -> Color {
        switch s.uppercased() {
        case "BULLISH": Theme.green
        case "BEARISH": Theme.red
        default: Theme.amber
        }
    }
}
