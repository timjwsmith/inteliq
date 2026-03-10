import Foundation

struct CallRecord: Codable, Identifiable {
    var id: String { sym }
    let sym: String
    let name: String
    let verdict: String       // BUY, WATCH, AVOID, HOLD
    let conviction: String?
    let entryPrice: Double
    let priceCurrency: String
    let calledAt: Date        // when the call was made
    let priceType: String     // "stock" or "crypto"
}
