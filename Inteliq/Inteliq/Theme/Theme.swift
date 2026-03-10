import SwiftUI

struct Theme {
    // Background
    static let bg       = Color(hex: "#120f1e")
    static let sidebar  = Color(hex: "#1a1630")
    static let card     = Color(hex: "#252040")
    static let cardAlt  = Color(hex: "#1e1a35")

    // Accents
    static let green    = Color(hex: "#00e676")
    static let red      = Color(hex: "#ff5252")
    static let amber    = Color(hex: "#ffab40")
    static let blue     = Color(hex: "#448aff")

    // Text
    static let textPrimary   = Color.white
    static let textSecondary = Color.white.opacity(0.6)
    static let textMuted     = Color.white.opacity(0.35)

    // Fonts
    static let heading   = Font.custom("Outfit-SemiBold", size: 18)
    static let headingLg = Font.custom("Outfit-SemiBold", size: 24)
    static let body      = Font.custom("DMSans-Regular", size: 14)
    static let bodyMed   = Font.custom("DMSans-Medium", size: 14)
    static let mono      = Font.custom("DMMono-Regular", size: 12)
    static let caption   = Font.custom("DMSans-Regular", size: 12)

    // Spacing
    static let paddingSm: CGFloat = 8
    static let paddingMd: CGFloat = 16
    static let paddingLg: CGFloat = 24
    static let cornerRadius: CGFloat = 12
}

// MARK: - Color hex init
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        let scanner = Scanner(string: hex)
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}

// MARK: - Card modifier
struct CardStyle: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(Theme.paddingMd)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius))
    }
}

extension View {
    func cardStyle() -> some View {
        modifier(CardStyle())
    }
}
