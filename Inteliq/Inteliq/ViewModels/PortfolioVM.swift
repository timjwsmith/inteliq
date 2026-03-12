import Foundation

@Observable
final class PortfolioVM {
    var holdings: [Holding] = []
    var summary: PortfolioSummary?
    var sources: SourceStatus?
    var audUsd: Double = 0
    var isLoading = false
    var error: String?

    // Filter
    var selectedSource: String? // nil = all
    var displayCurrency: String = "USD" // USD or AUD

    var filteredHoldings: [Holding] {
        guard let source = selectedSource else { return holdings }
        return holdings.filter { $0.source == source }
    }

    var availableSources: [String] {
        Array(Set(holdings.map(\.source))).sorted()
    }

    // Currency conversion helpers
    var currencyMultiplier: Double {
        displayCurrency == "AUD" && audUsd > 0 ? 1.0 / audUsd : 1.0
    }

    var currencySymbol: String {
        displayCurrency == "AUD" ? "A$" : "$"
    }

    func load() async {
        isLoading = true
        error = nil
        do {
            let cmcHoldings = CMCStorage.load()
            let body = PortfolioCombinedRequest(
                cmcHoldings: cmcHoldings.isEmpty ? nil : cmcHoldings,
                ledgerAddresses: []
            )
            let response: PortfolioResponse = try await APIService.shared.post("/api/portfolio/combined", body: body)
            holdings = response.holdings
            summary = response.summary
            sources = response.sources
            audUsd = response.audUsd
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

private struct PortfolioCombinedRequest: Encodable {
    let cmcHoldings: [CMCHolding]?
    let ledgerAddresses: [String]
}
