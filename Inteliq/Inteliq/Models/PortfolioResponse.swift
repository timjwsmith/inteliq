import Foundation

/// Response from POST /api/portfolio/combined
struct PortfolioResponse: Codable {
    let holdings: [Holding]
    let audUsd: Double
    let summary: PortfolioSummary
    let sources: SourceStatus
    let lastSync: String
}

struct PortfolioSummary: Codable {
    let totalValueUsd: Double
    let totalCostUsd: Double
    let totalPlUsd: Double
    let totalPlPct: Double
    let holdingCount: Int
    let cryptoCount: Int
    let stockCount: Int

    private enum CodingKeys: String, CodingKey {
        case totalValueUsd = "totalValueUSD"
        case totalCostUsd = "totalCostUSD"
        case totalPlUsd = "totalPLusd"
        case totalPlPct = "totalPLpct"
        case holdingCount, cryptoCount, stockCount
    }
}

struct SourceStatus: Codable {
    let coinbase: String
    let binance: String
    let tiger: String
    let ledger: String
}
