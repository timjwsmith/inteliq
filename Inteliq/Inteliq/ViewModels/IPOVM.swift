import Foundation

@Observable
final class IPOVM {
    var ipos: [IPOItem] = []
    var isLoading = false
    var error: String?
    var selectedFilter: String = "ALL"

    let filters = ["ALL", "UPCOMING", "PRICED", "FILED", "WITHDRAWN"]

    var filteredIPOs: [IPOItem] {
        guard selectedFilter != "ALL" else { return ipos }
        return ipos.filter { ($0.status ?? "").uppercased() == selectedFilter }
    }

    func load() async {
        isLoading = true
        error = nil
        do {
            ipos = try await APIService.shared.get("/api/ipo")
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
