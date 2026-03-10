import Foundation

/// A macro event from POST /api/macro
struct MacroEvent: Codable, Identifiable {
    var id: String { "\(date)_\(event)" }

    let date: String
    let event: String
    let category: String
    let importance: String
    let country: String
    let preview: String
    let bullCase: String
    let bearCase: String
    let portfolioImpact: String
    let affectedHoldings: [String]
}
