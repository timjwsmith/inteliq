import Foundation

/// An IPO calendar entry from GET /api/ipo (Finnhub)
struct IPOItem: Codable, Identifiable {
    var id: String { (symbol ?? "") + (date ?? "") + (name ?? "") }

    let date: String?
    let exchange: String?
    let name: String?
    let numberOfShares: Double?
    let price: String?
    let status: String?
    let symbol: String?
    let totalSharesValue: Double?
}
