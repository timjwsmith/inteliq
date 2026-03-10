import Foundation

@Observable
final class EarningsVM {
    var upcoming: [EarningsItem] = []
    var recent: [EarningsItem] = []
    var isLoading = false
    var error: String?

    func load() async {
        isLoading = true
        error = nil
        do {
            // 1. Fetch portfolio holdings
            let body = ["ledgerAddresses": [String]()]
            let portfolio: PortfolioResponse = try await APIService.shared.post(
                "/api/portfolio/combined", body: body
            )

            // 2. Filter stock holdings only
            let stocks = portfolio.holdings.filter { $0.isStock }
            guard !stocks.isEmpty else {
                isLoading = false
                return
            }

            // 3. Build symbols payload
            let symbols = stocks.map { ["sym": $0.sym, "type": "stock"] }
            let earningsBody = ["symbols": symbols]

            // 4. Fetch earnings data — response is [String: [EarningsItem]]
            let earningsMap: [String: [EarningsItem]] = try await APIService.shared.post(
                "/api/earnings", body: earningsBody
            )

            // 5. Flatten and sort
            let allItems = earningsMap.values.flatMap { $0 }
            let today = Calendar.current.startOfDay(for: Date())
            let sixtyDaysAgo = Calendar.current.date(byAdding: .day, value: -60, to: today)!

            upcoming = allItems
                .filter { item in
                    guard let d = item.parsedDate else { return false }
                    return d >= today
                }
                .sorted { ($0.parsedDate ?? .distantFuture) < ($1.parsedDate ?? .distantFuture) }

            recent = allItems
                .filter { item in
                    guard let d = item.parsedDate else { return false }
                    return d < today && d >= sixtyDaysAgo
                }
                .sorted { ($0.parsedDate ?? .distantPast) > ($1.parsedDate ?? .distantPast) }

        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
