import Foundation

@Observable
final class MacroVM {
    var events: [MacroEvent] = []
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

            // 2. Build holdingSyms array (what the server expects)
            let syms = portfolio.holdings.map { $0.sym }
            let macroBody = MacroRequestBody(holdingSyms: syms)

            // 3. Fetch macro events
            let result: [MacroEvent] = try await APIService.shared.post("/api/macro", body: macroBody)

            // Sort by date ascending
            events = result.sorted { $0.date < $1.date }
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

private struct MacroRequestBody: Encodable {
    let holdingSyms: [String]
}
