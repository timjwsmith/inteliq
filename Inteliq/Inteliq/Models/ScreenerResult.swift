import Foundation

struct ScreenerResult: Codable, Identifiable {
    let id: UUID

    let sym: String
    let name: String
    let sector: String?
    let verdict: String
    let conviction: String?
    let horizon: String?
    let priceStatic: Double?
    let target: String?
    let upside: String?
    let up: Bool?
    let priceType: String?
    let priceCurrency: String?
    let summary: String?
    let matchReason: String?
    let macro: String?
    let fundamental: String?
    let technical: String?
    let sentiment: String?

    // Server doesn't send `id`, so we generate one client-side
    enum CodingKeys: String, CodingKey {
        case sym, name, sector, verdict, conviction, horizon
        case priceStatic, target, upside, up, priceType, priceCurrency
        case summary, matchReason, macro, fundamental, technical, sentiment
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = UUID()
        sym = try c.decode(String.self, forKey: .sym)
        name = try c.decode(String.self, forKey: .name)
        sector = try c.decodeIfPresent(String.self, forKey: .sector)
        verdict = try c.decode(String.self, forKey: .verdict)
        conviction = try c.decodeIfPresent(String.self, forKey: .conviction)
        horizon = try c.decodeIfPresent(String.self, forKey: .horizon)
        priceStatic = try c.decodeIfPresent(Double.self, forKey: .priceStatic)
        target = try c.decodeIfPresent(String.self, forKey: .target)
        upside = try c.decodeIfPresent(String.self, forKey: .upside)
        up = try c.decodeIfPresent(Bool.self, forKey: .up)
        priceType = try c.decodeIfPresent(String.self, forKey: .priceType)
        priceCurrency = try c.decodeIfPresent(String.self, forKey: .priceCurrency)
        summary = try c.decodeIfPresent(String.self, forKey: .summary)
        matchReason = try c.decodeIfPresent(String.self, forKey: .matchReason)
        macro = try c.decodeIfPresent(String.self, forKey: .macro)
        fundamental = try c.decodeIfPresent(String.self, forKey: .fundamental)
        technical = try c.decodeIfPresent(String.self, forKey: .technical)
        sentiment = try c.decodeIfPresent(String.self, forKey: .sentiment)
    }
}
