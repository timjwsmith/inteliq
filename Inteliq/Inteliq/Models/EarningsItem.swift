import Foundation

/// A single earnings report entry from POST /api/earnings
struct EarningsItem: Codable, Identifiable {
    var id: String { "\(symbol)_\(date)" }

    let date: String
    let symbol: String
    let epsActual: Double?
    let epsEstimated: Double?
    let time: String?
    let revenueActual: Double?
    let revenueEstimated: Double?
    let fiscalDateEnding: String?
    let lastUpdated: String?

    /// EPS surprise percentage — positive = beat, negative = miss
    var surprise: Double? {
        guard let actual = epsActual, let est = epsEstimated, est != 0 else { return nil }
        return ((actual - est) / abs(est)) * 100
    }

    /// Parsed date for sorting and comparison
    var parsedDate: Date? {
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.timeZone = TimeZone(identifier: "UTC")
        return fmt.date(from: date)
    }

    /// Human-readable date string (e.g. "Apr 25")
    var displayDate: String {
        guard let d = parsedDate else { return date }
        let fmt = DateFormatter()
        fmt.dateFormat = "MMM d"
        return fmt.string(from: d)
    }

    /// Time badge text
    var timeBadge: String? {
        switch time?.lowercased() {
        case "bmo": return "BMO"
        case "amc": return "AMC"
        default: return nil
        }
    }

    /// Days until this earnings date (negative = past)
    var daysFromNow: Int? {
        guard let d = parsedDate else { return nil }
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        let target = cal.startOfDay(for: d)
        return cal.dateComponents([.day], from: today, to: target).day
    }

    /// Countdown label for upcoming earnings
    var countdown: String? {
        guard let days = daysFromNow, days >= 0 else { return nil }
        if days == 0 { return "TODAY" }
        if days == 1 { return "Tomorrow" }
        return "in \(days)d"
    }
}
