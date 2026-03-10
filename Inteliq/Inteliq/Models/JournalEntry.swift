import Foundation

struct JournalEntry: Codable, Identifiable {
    let id: UUID
    let date: Date
    let sym: String
    let action: String        // "BUY" or "SELL"
    let qty: Double
    let price: Double
    let currency: String      // "USD" or "AUD"
    let thesis: String
    var exitPrice: Double?
    var exitDate: Date?

    var isClosed: Bool { exitPrice != nil }

    var returnPct: Double? {
        guard let exit = exitPrice, price > 0 else { return nil }
        let raw = ((exit - price) / price) * 100
        return action == "BUY" ? raw : -raw
    }
}
