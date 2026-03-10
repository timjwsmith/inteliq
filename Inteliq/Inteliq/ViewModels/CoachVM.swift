import Foundation

@Observable
final class CoachVM {
    var result: CoachResult?
    var isLoading = false
    var error: String?

    func analyse() async {
        isLoading = true
        error = nil
        do {
            // 1. Fetch current portfolio
            let portfolioBody = ["ledgerAddresses": [String]()]
            let portfolio: PortfolioResponse = try await APIService.shared.post(
                "/api/portfolio/combined",
                body: portfolioBody
            )

            let holdings = portfolio.holdings
            guard !holdings.isEmpty else {
                error = "No holdings found"
                isLoading = false
                return
            }

            // 2. Build the snapshot the server expects
            let totalValue = holdings.compactMap(\.valueUSD).reduce(0, +)
            let cryptoValue = holdings.filter(\.isCrypto).compactMap(\.valueUSD).reduce(0, +)
            let stockValue = holdings.filter(\.isStock).compactMap(\.valueUSD).reduce(0, +)
            let cryptoPct = totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0
            let stocksPct = totalValue > 0 ? (stockValue / totalValue) * 100 : 0

            // Sector breakdown
            var sectorMap: [String: Double] = [:]
            for h in holdings {
                let val = h.valueUSD ?? 0
                sectorMap[h.sector, default: 0] += val
            }
            var sectorBreakdown: [String: Double] = [:]
            for (sector, val) in sectorMap {
                sectorBreakdown[sector] = totalValue > 0 ? (val / totalValue) * 100 : 0
            }

            // Holdings with weight percentage
            let snapshotHoldings = holdings.map { h -> CoachSnapshotHolding in
                let pct = totalValue > 0 ? ((h.valueUSD ?? 0) / totalValue) * 100 : 0
                let unrealisedPct = h.plPct
                return CoachSnapshotHolding(
                    sym: h.sym, name: h.name, pct: pct,
                    valueUSD: h.valueUSD ?? 0, priceType: h.priceType,
                    sector: h.sector, unrealisedPct: unrealisedPct
                )
            }

            let snapshot = CoachSnapshot(
                holdings: snapshotHoldings,
                totalValueUSD: totalValue,
                cryptoPct: cryptoPct,
                stocksPct: stocksPct,
                sectorBreakdown: sectorBreakdown
            )

            // 3. Send to coach endpoint
            let coachBody = CoachRequestBody(snapshot: snapshot)
            let coachResult: CoachResult = try await APIService.shared.post(
                "/api/portfolio/coach",
                body: coachBody
            )
            result = coachResult
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

// MARK: - Request types

private struct CoachRequestBody: Encodable {
    let snapshot: CoachSnapshot
}

private struct CoachSnapshot: Encodable {
    let holdings: [CoachSnapshotHolding]
    let totalValueUSD: Double
    let cryptoPct: Double
    let stocksPct: Double
    let sectorBreakdown: [String: Double]
}

private struct CoachSnapshotHolding: Encodable {
    let sym: String
    let name: String
    let pct: Double
    let valueUSD: Double
    let priceType: String
    let sector: String
    let unrealisedPct: Double?
}
