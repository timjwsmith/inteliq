import Foundation

/// A single AI-generated pick from GET /api/dashboard/picks
struct DashboardPick: Codable, Identifiable {
    var id: String { sym }

    let sym: String
    let name: String
    let sector: String?
    let verdict: String
    let conviction: String
    let horizon: String
    let priceStatic: Double?
    let target: String?
    let upside: String?
    let up: Bool?
    let priceType: String?
    let priceCurrency: String?
    let summary: String?
    let macro: String?
    let fundamental: String?
    let technical: String?
    let sentiment: String?
    let insider: String?
    let portfolio: String?

    var displayPrice: Double { priceStatic ?? 0 }
    var thesis: String { summary ?? "" }
}
