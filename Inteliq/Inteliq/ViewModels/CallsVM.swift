import Foundation

@Observable
final class CallsVM {

    // MARK: - Persisted records

    var records: [CallRecord] = []
    var livePrices: [String: Double] = [:]
    var isLoading = false
    var error: String?
    var selectedFilter: String = "ALL"

    private static let storageKey = "inteliq_calls"

    // MARK: - Init

    init() {
        loadRecords()
    }

    // MARK: - Persistence

    private func loadRecords() {
        guard let data = UserDefaults.standard.data(forKey: Self.storageKey) else { return }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        records = (try? decoder.decode([CallRecord].self, from: data)) ?? []
    }

    private static func saveRecords(_ records: [CallRecord]) {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if let data = try? encoder.encode(records) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    // MARK: - Add record (static, callable from anywhere)

    static func addRecord(
        sym: String,
        name: String,
        verdict: String,
        conviction: String?,
        entryPrice: Double,
        priceCurrency: String,
        priceType: String
    ) {
        var existing = loadAllRecords()
        // Deduplicate — only one record per sym
        guard !existing.contains(where: { $0.sym == sym }) else { return }
        let record = CallRecord(
            sym: sym,
            name: name,
            verdict: verdict,
            conviction: conviction,
            entryPrice: entryPrice,
            priceCurrency: priceCurrency,
            calledAt: Date(),
            priceType: priceType
        )
        existing.insert(record, at: 0)
        saveRecords(existing)
    }

    private static func loadAllRecords() -> [CallRecord] {
        guard let data = UserDefaults.standard.data(forKey: storageKey) else { return [] }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return (try? decoder.decode([CallRecord].self, from: data)) ?? []
    }

    // MARK: - Remove record

    func removeRecord(sym: String) {
        records.removeAll { $0.sym == sym }
        Self.saveRecords(records)
    }

    // MARK: - Fetch live prices

    func fetchPrices() async {
        guard !records.isEmpty else { return }
        isLoading = true
        error = nil

        do {
            let symbols = records.map { PriceSymbol(sym: $0.sym, type: $0.priceType) }
            let body = PriceRequest(symbols: symbols)
            let response: [String: PriceEntry] = try await APIService.shared.post("/api/prices", body: body)
            var prices: [String: Double] = [:]
            for (key, entry) in response {
                prices[key] = entry.price
            }
            livePrices = prices
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    // MARK: - Refresh (reload from disk + fetch)

    func refresh() async {
        loadRecords()
        await fetchPrices()
    }

    // MARK: - Computed

    var filteredRecords: [CallRecord] {
        if selectedFilter == "ALL" { return records }
        return records.filter { $0.verdict.uppercased() == selectedFilter }
    }

    func returnPercent(for record: CallRecord) -> Double? {
        guard let live = livePrices[record.sym], record.entryPrice > 0 else { return nil }
        return ((live - record.entryPrice) / record.entryPrice) * 100
    }

    // MARK: - Stats (BUY calls only)

    private var buyRecords: [CallRecord] {
        records.filter { $0.verdict.uppercased() == "BUY" || $0.verdict.uppercased() == "STRONG BUY" }
    }

    var totalCalls: Int { records.count }

    var buyWinRate: Double? {
        let buys = buyRecords
        guard !buys.isEmpty else { return nil }
        let wins = buys.filter { r in
            guard let ret = returnPercent(for: r) else { return false }
            return ret > 0
        }
        return Double(wins.count) / Double(buys.count) * 100
    }

    var avgBuyReturn: Double? {
        let returns = buyRecords.compactMap { returnPercent(for: $0) }
        guard !returns.isEmpty else { return nil }
        return returns.reduce(0, +) / Double(returns.count)
    }

    var bestBuy: (String, Double)? {
        buyRecords
            .compactMap { r -> (String, Double)? in
                guard let ret = returnPercent(for: r) else { return nil }
                return (r.sym, ret)
            }
            .max(by: { $0.1 < $1.1 })
    }

    var worstBuy: (String, Double)? {
        buyRecords
            .compactMap { r -> (String, Double)? in
                guard let ret = returnPercent(for: r) else { return nil }
                return (r.sym, ret)
            }
            .min(by: { $0.1 < $1.1 })
    }

    // MARK: - Filter counts

    func count(for filter: String) -> Int {
        if filter == "ALL" { return records.count }
        return records.filter { $0.verdict.uppercased() == filter }.count
    }
}

// MARK: - API types

private struct PriceSymbol: Encodable {
    let sym: String
    let type: String
}

private struct PriceRequest: Encodable {
    let symbols: [PriceSymbol]
}

private struct PriceEntry: Decodable {
    let price: Double
    let currency: String?
}
