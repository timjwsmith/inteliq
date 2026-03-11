import Foundation

/// A portfolio holding returned by /api/portfolio/combined
struct Holding: Codable, Identifiable, Hashable {
    var id: String { "\(source)_\(sym)" }

    let sym: String
    let name: String
    let qty: Double
    let avg: Double
    let avgCurrency: String
    let sector: String
    let horizon: String
    let priceType: String
    let source: String

    // Enriched by combined endpoint
    let livePrice: Double?
    let livePriceUSD: Double?
    let priceCurrency: String?
    let valueUSD: Double?
    let costUSD: Double?
    let plUSD: Double?
    let plPct: Double?
    let change: Double?
    let changeStr: String?
    let up: Bool?

    var isCrypto: Bool { priceType == "crypto" }
    var isStock: Bool { priceType == "stock" }

    var displayPrice: Double { livePrice ?? 0 }
    var displayValue: Double { valueUSD ?? 0 }
    var displayPL: Double { plUSD ?? 0 }
    var displayPLpct: Double { plPct ?? 0 }
    var isUp: Bool { up ?? true }
}
