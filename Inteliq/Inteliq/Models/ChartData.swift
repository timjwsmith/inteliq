import Foundation

struct ChartResponse: Codable {
    let sym: String
    let name: String?
    let currency: String?
    let currentPrice: Double?
    let candles: [Candle]
    let range: String?
}

struct Candle: Codable, Identifiable {
    var id: Double { t }

    let t: Double  // timestamp ms
    let o: Double  // open
    let h: Double  // high
    let l: Double  // low
    let c: Double  // close
    let v: Double  // volume

    var date: Date { Date(timeIntervalSince1970: t / 1000) }
}
