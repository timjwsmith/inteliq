import Foundation

@Observable
final class NewsVM {
    var articles: [NewsItem] = []
    var isLoading = false
    var error: String?
    var selectedCategory: String = "ALL"

    let categories = ["ALL", "US TECH", "ASX MINING", "CRYPTO"]

    var filteredArticles: [NewsItem] {
        guard selectedCategory != "ALL" else { return articles }
        return articles.filter { ($0.tag ?? "").uppercased().contains(selectedCategory) }
    }

    func load() async {
        isLoading = true
        error = nil
        do {
            articles = try await APIService.shared.get("/api/news")
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
