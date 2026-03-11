import Foundation

/// Persists CMC Invest holdings in UserDefaults
enum CMCStorage {
    private static let key = "inteliq_cmc"

    static func load() -> [CMCHolding] {
        guard let data = UserDefaults.standard.data(forKey: key) else {
            // First launch: auto-import from bundled CSV
            let bundled = loadFromBundle()
            if !bundled.isEmpty {
                save(bundled)
            }
            return bundled
        }
        return (try? JSONDecoder().decode([CMCHolding].self, from: data)) ?? []
    }

    static func save(_ holdings: [CMCHolding]) {
        if let data = try? JSONEncoder().encode(holdings) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    static func clear() {
        UserDefaults.standard.removeObject(forKey: key)
    }

    static var isEmpty: Bool {
        !UserDefaults.standard.bool(forKey: "inteliq_cmc_loaded") && UserDefaults.standard.data(forKey: key) == nil
    }

    /// Load from bundled CMCPortfolio.csv on first launch
    private static func loadFromBundle() -> [CMCHolding] {
        guard let url = Bundle.main.url(forResource: "CMCPortfolio", withExtension: "csv"),
              let text = try? String(contentsOf: url, encoding: .utf8),
              let holdings = try? CMCParser.parse(text) else {
            return []
        }
        UserDefaults.standard.set(true, forKey: "inteliq_cmc_loaded")
        return holdings
    }
}
