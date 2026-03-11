import Foundation

@Observable
final class ScreenerVM {
    var query = ""
    var results: [ScreenerResult] = []
    var isLoading = false
    var error: String?

    func search() async {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return }

        isLoading = true
        error = nil
        results = []
        do {
            let body = ScreenerRequest(query: q)
            let response: [ScreenerResult] = try await APIService.shared.post("/api/screener", body: body)
            results = response
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func searchWith(_ preset: String) async {
        query = preset
        await search()
    }
}

private struct ScreenerRequest: Encodable {
    let query: String
}
