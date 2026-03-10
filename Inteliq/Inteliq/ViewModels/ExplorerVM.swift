import Foundation

@Observable
final class ExplorerVM {
    var query = ""
    var result: ExplorerResult?
    var isLoading = false
    var error: String?
    var searchHistory: [String] = []

    func search() async {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }

        isLoading = true
        error = nil
        result = nil
        do {
            let body = SearchRequest(query: q)
            let response: ExplorerResult = try await APIService.shared.post("/api/explorer/search", body: body)
            result = response

            if !searchHistory.contains(q) {
                searchHistory.insert(q, at: 0)
                if searchHistory.count > 10 { searchHistory.removeLast() }
            }
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}

struct SearchRequest: Encodable {
    let query: String
}

/// Analysis result — same shape as dashboard picks
struct ExplorerResult: Codable, Identifiable {
    var id: String { sym }

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
    let macro: String?
    let fundamental: String?
    let technical: String?
    let sentiment: String?
    let insider: String?
    let portfolio: String?
}
