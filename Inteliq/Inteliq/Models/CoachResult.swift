import Foundation

/// Response from POST /api/portfolio/coach
struct CoachResult: Codable {
    let grade: String?
    let gradeNote: String?
    let riskProfile: String?
    let riskNote: String?
    let summary: String?
    let concentration: String?
    let diversification: String?
    let strengths: [String]?
    let weaknesses: [String]?
    let actions: [CoachAction]?
    let sectorComment: String?
    let cryptoComment: String?
    let outlook: String?
}

struct CoachAction: Codable, Identifiable {
    var id: String { "\(priority)_\(action.prefix(20))" }

    let priority: String
    let action: String
    let reason: String?
}
