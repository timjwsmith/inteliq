import SwiftUI

struct CoachView: View {
    @State private var vm = CoachVM()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("AI Portfolio Coach")
                    .font(Theme.headingLg)
                    .foregroundStyle(Theme.textPrimary)

                if vm.isLoading {
                    loadingView
                } else if let result = vm.result {
                    resultView(result)
                } else {
                    emptyState
                }

                if let error = vm.error {
                    Text(error)
                        .font(Theme.caption)
                        .foregroundStyle(Theme.red)
                        .cardStyle()
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: Theme.paddingMd) {
            Text("Get an AI-powered assessment of your portfolio including concentration risk, sector imbalance, overall grade, and rebalancing suggestions.")
                .font(Theme.body)
                .foregroundStyle(Theme.textSecondary)

            Button {
                Task { await vm.analyse() }
            } label: {
                HStack {
                    Image(systemName: "brain.head.profile")
                    Text("RUN COACH ANALYSIS")
                        .font(Theme.bodyMed)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Theme.green)
                .foregroundStyle(Theme.bg)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(Theme.green)
                .scaleEffect(1.2)
            Text("Analysing portfolio...")
                .font(Theme.bodyMed)
                .foregroundStyle(Theme.textSecondary)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .cardStyle()
    }

    // MARK: - Result

    @ViewBuilder
    private func resultView(_ r: CoachResult) -> some View {
        // Re-run button
        Button {
            Task { await vm.analyse() }
        } label: {
            HStack {
                Image(systemName: "arrow.clockwise")
                Text("RE-RUN ANALYSIS")
                    .font(Theme.bodyMed)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(Theme.card)
            .foregroundStyle(Theme.green)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Theme.green.opacity(0.4), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }

        // Grade & Risk
        HStack(spacing: 12) {
            if let grade = r.grade {
                VStack(alignment: .leading, spacing: 4) {
                    Text("GRADE")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                    Text(grade)
                        .font(.system(size: 32, weight: .bold, design: .monospaced))
                        .foregroundStyle(gradeColor(grade))
                    if let note = r.gradeNote {
                        Text(note)
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textSecondary)
                            .lineLimit(2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .cardStyle()
            }

            if let risk = r.riskProfile {
                VStack(alignment: .leading, spacing: 4) {
                    Text("RISK PROFILE")
                        .font(Theme.caption)
                        .foregroundStyle(Theme.textMuted)
                    Text(risk)
                        .font(Theme.heading)
                        .foregroundStyle(riskColor(risk))
                    if let note = r.riskNote {
                        Text(note)
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textSecondary)
                            .lineLimit(2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .cardStyle()
            }
        }

        // Summary
        if let summary = r.summary {
            VStack(alignment: .leading, spacing: 8) {
                Text("Summary")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.textPrimary)
                Text(summary)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }
            .cardStyle()
        }

        // Concentration & Diversification
        if let conc = r.concentration {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(Theme.amber)
                        .font(.system(size: 12))
                    Text("Concentration")
                        .font(Theme.heading)
                        .foregroundStyle(Theme.amber)
                }
                Text(conc)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }
            .cardStyle()
        }

        if let div = r.diversification {
            VStack(alignment: .leading, spacing: 8) {
                Text("Diversification")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.blue)
                Text(div)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }
            .cardStyle()
        }

        // Strengths & Weaknesses
        if let strengths = r.strengths, let weaknesses = r.weaknesses {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Strengths")
                        .font(Theme.heading)
                        .foregroundStyle(Theme.green)
                    ForEach(strengths, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(Theme.green)
                                .font(.system(size: 14))
                            Text(item)
                                .font(Theme.caption)
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .cardStyle()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Weaknesses")
                        .font(Theme.heading)
                        .foregroundStyle(Theme.red)
                    ForEach(weaknesses, id: \.self) { item in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(Theme.red)
                                .font(.system(size: 14))
                            Text(item)
                                .font(Theme.caption)
                                .foregroundStyle(Theme.textSecondary)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .cardStyle()
            }
        }

        // Actions
        if let actions = r.actions, !actions.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                Text("Recommended Actions")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.textPrimary)

                ForEach(actions) { action in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(alignment: .top, spacing: 10) {
                            Text(action.priority)
                                .font(Theme.caption)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(priorityColor(action.priority))
                                .clipShape(RoundedRectangle(cornerRadius: 6))

                            Text(action.action)
                                .font(Theme.body)
                                .foregroundStyle(Theme.textPrimary)
                        }
                        if let reason = action.reason {
                            Text(reason)
                                .font(Theme.caption)
                                .foregroundStyle(Theme.textMuted)
                                .padding(.leading, 60)
                        }
                    }
                }
            }
            .cardStyle()
        }

        // Sector & Crypto comments
        if let sector = r.sectorComment {
            VStack(alignment: .leading, spacing: 8) {
                Text("Sector Allocation")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.blue)
                Text(sector)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }
            .cardStyle()
        }

        if let crypto = r.cryptoComment {
            VStack(alignment: .leading, spacing: 8) {
                Text("Crypto Allocation")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.amber)
                Text(crypto)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }
            .cardStyle()
        }

        // Outlook
        if let outlook = r.outlook {
            VStack(alignment: .leading, spacing: 8) {
                Text("Outlook")
                    .font(Theme.heading)
                    .foregroundStyle(Theme.green)
                Text(outlook)
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)
            }
            .cardStyle()
        }
    }

    // MARK: - Helpers

    private func gradeColor(_ grade: String) -> Color {
        if grade.hasPrefix("A") { return Theme.green }
        if grade.hasPrefix("B") { return Theme.blue }
        if grade.hasPrefix("C") { return Theme.amber }
        return Theme.red
    }

    private func riskColor(_ profile: String) -> Color {
        switch profile.uppercased() {
        case "CONSERVATIVE": return Theme.blue
        case "BALANCED": return Theme.green
        case "AGGRESSIVE": return Theme.amber
        default: return Theme.red
        }
    }

    private func priorityColor(_ priority: String) -> Color {
        switch priority.uppercased() {
        case "HIGH": return Theme.red
        case "MEDIUM": return Theme.amber
        default: return Theme.blue
        }
    }
}
