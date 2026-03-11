import SwiftUI
import Charts

struct PriceChartView: View {
    let sym: String
    let priceType: String
    @State private var candles: [Candle] = []
    @State private var isLoading = true
    @State private var selectedRange = "1mo"
    @AppStorage("displayCurrency") private var currency = "AUD"

    let ranges = ["1d", "7d", "1mo", "3mo", "1y"]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Range selector
            HStack(spacing: 6) {
                ForEach(ranges, id: \.self) { range in
                    Button {
                        selectedRange = range
                        Task { await loadChart() }
                    } label: {
                        Text(range.uppercased())
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(selectedRange == range ? Theme.green.opacity(0.2) : Theme.cardAlt)
                            .foregroundStyle(selectedRange == range ? Theme.green : Theme.textMuted)
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                    }
                }
            }

            if isLoading {
                ProgressView()
                    .tint(Theme.green)
                    .frame(maxWidth: .infinity, minHeight: 150)
            } else if candles.isEmpty {
                Text("No chart data available")
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)
                    .frame(maxWidth: .infinity, minHeight: 150)
            } else {
                // Price chart
                Chart(candles) { candle in
                    LineMark(
                        x: .value("Date", candle.date),
                        y: .value("Price", candle.c)
                    )
                    .foregroundStyle(chartColor)
                    .lineStyle(StrokeStyle(lineWidth: 1.5))

                    AreaMark(
                        x: .value("Date", candle.date),
                        yStart: .value("Min", minPrice),
                        yEnd: .value("Price", candle.c)
                    )
                    .foregroundStyle(
                        LinearGradient(
                            colors: [chartColor.opacity(0.3), chartColor.opacity(0.0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                }
                .chartYScale(domain: minPrice...maxPrice)
                .chartXAxis {
                    AxisMarks(values: .automatic(desiredCount: 4)) { value in
                        AxisValueLabel()
                            .foregroundStyle(Theme.textMuted)
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .trailing, values: .automatic(desiredCount: 4)) { value in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5, dash: [4]))
                            .foregroundStyle(Theme.textMuted.opacity(0.2))
                        AxisValueLabel()
                            .foregroundStyle(Theme.textMuted)
                    }
                }
                .frame(height: 180)
            }
        }
        .task { await loadChart() }
    }

    private var chartColor: Color {
        guard let first = candles.first, let last = candles.last else { return Theme.green }
        return last.c >= first.c ? Theme.green : Theme.red
    }

    private var minPrice: Double {
        (candles.map(\.l).min() ?? 0) * 0.998
    }

    private var maxPrice: Double {
        (candles.map(\.h).max() ?? 1) * 1.002
    }

    private func loadChart() async {
        isLoading = true
        do {
            let data: ChartResponse = try await APIService.shared.get("/api/chart/\(sym)?range=\(selectedRange)&currency=\(currency)")
            candles = data.candles
        } catch {}
        isLoading = false
    }
}
