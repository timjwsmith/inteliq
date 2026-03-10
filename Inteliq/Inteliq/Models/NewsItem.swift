import Foundation

/// A news article from GET /api/news
struct NewsItem: Codable, Identifiable {
    var id: String { link }

    let headline: String
    let link: String
    let time: String?
    let tag: String?
    let sentiment: String?
    let impact: String?
    let affected: [String]?
    let commentary: String?
    let live: Bool?
}
