import Foundation
import SwiftData

/// A saved watchlist entry — persisted locally via SwiftData
@Model
final class WatchlistItem {
    var sym: String
    var name: String
    var targetPrice: Double
    var addedAt: Date

    init(sym: String, name: String, targetPrice: Double = 0, addedAt: Date = .now) {
        self.sym = sym
        self.name = name
        self.targetPrice = targetPrice
        self.addedAt = addedAt
    }
}
