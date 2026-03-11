import SwiftUI

struct LogoHeader: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 0) {
                Text("INTEL")
                    .font(.system(size: 22, weight: .black))
                    .foregroundStyle(Theme.textPrimary)
                    .tracking(-0.5)
                Text("IQ")
                    .font(.system(size: 22, weight: .black))
                    .foregroundStyle(Theme.green)
                    .tracking(-0.5)
            }
            Text("INVESTMENT INTELLIGENCE")
                .font(.system(size: 9, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.textMuted)
                .tracking(1)
        }
    }
}
