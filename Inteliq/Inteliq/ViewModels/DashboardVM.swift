import Foundation

@Observable
final class DashboardVM {
    var picks: [DashboardPick] = []
    var isLoading = false
    var error: String?

    func loadPicks(force: Bool = false) async {
        isLoading = true
        error = nil
        do {
            let path = force ? "/api/dashboard/picks?force=1" : "/api/dashboard/picks"
            let response: [DashboardPick] = try await APIService.shared.get(path)
            picks = response
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }
}
