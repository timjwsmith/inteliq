import SwiftUI
import SwiftData

struct ContentView: View {
    init() {
        // Dark navigation bar
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(Theme.bg)
        navAppearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        navAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance

        // Dark tab bar
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor(Theme.sidebar)
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }

    var body: some View {
        TabView {
            Tab("Dashboard", systemImage: "square.grid.2x2") {
                NavigationStack {
                    DashboardView()
                }
            }

            Tab("Portfolio", systemImage: "chart.pie") {
                NavigationStack {
                    PortfolioView()
                }
            }

            Tab("Explorer", systemImage: "magnifyingglass") {
                NavigationStack {
                    ExplorerView()
                }
            }

            Tab("Watchlist", systemImage: "star") {
                NavigationStack {
                    WatchlistView()
                }
            }

            Tab("More", systemImage: "ellipsis") {
                NavigationStack {
                    MoreView()
                }
            }
        }
        .tint(Theme.green)
    }
}

#Preview {
    ContentView()
        .modelContainer(for: WatchlistItem.self, inMemory: true)
}
