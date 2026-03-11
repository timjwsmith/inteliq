import Foundation

struct JournalAnalysis: Codable {
    let summary: String
    let keyAdvice: String
    let winRate: Double?
    let topMistake: String?
    let patterns: [BehaviourPattern]
}

struct BehaviourPattern: Codable, Identifiable {
    var id: String { name }
    let name: String
    let severity: String
    let description: String
    let advice: String
}
