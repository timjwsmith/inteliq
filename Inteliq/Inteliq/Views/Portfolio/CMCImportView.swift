import SwiftUI
import UniformTypeIdentifiers

struct CMCImportView: View {
    let onImport: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showFilePicker = false
    @State private var importedCount = 0
    @State private var error: String?
    @State private var isImported = false
    @State private var holdings: [CMCHolding] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.paddingMd) {
                    LogoHeader()

                    Text("CMC Invest Import")
                        .font(Theme.headingLg)
                        .foregroundStyle(Theme.textPrimary)

                    Text("Import your CMC Invest Portfolio Report CSV to include your CMC holdings in the portfolio.")
                        .font(Theme.body)
                        .foregroundStyle(Theme.textSecondary)

                    // Instructions
                    VStack(alignment: .leading, spacing: 8) {
                        Text("HOW TO EXPORT")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                            .tracking(1.2)

                        instructionRow(step: "1", text: "Open CMC Invest app or website")
                        instructionRow(step: "2", text: "Go to Account → Reports")
                        instructionRow(step: "3", text: "Select Portfolio Report")
                        instructionRow(step: "4", text: "Download CSV")
                        instructionRow(step: "5", text: "Import below")
                    }
                    .cardStyle()

                    // Import button
                    Button {
                        showFilePicker = true
                    } label: {
                        HStack {
                            Image(systemName: "doc.badge.plus")
                            Text("SELECT CSV FILE")
                                .font(Theme.bodyMed)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Theme.green)
                        .foregroundStyle(Theme.bg)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    // Error
                    if let error {
                        Text(error)
                            .font(Theme.caption)
                            .foregroundStyle(Theme.red)
                            .padding(12)
                            .background(Theme.red.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Success
                    if isImported {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Theme.green)
                                Text("Imported \(importedCount) holdings")
                                    .font(Theme.bodyMed)
                                    .foregroundStyle(Theme.green)
                            }

                            ForEach(holdings) { h in
                                HStack {
                                    Text(h.sym)
                                        .font(Theme.mono)
                                        .foregroundStyle(Theme.textPrimary)
                                    Spacer()
                                    Text("×\(h.qty.formatted(.number.precision(.fractionLength(0...2))))")
                                        .font(Theme.caption)
                                        .foregroundStyle(Theme.textMuted)
                                    Text("@ \(h.avg.formatted(.currency(code: "AUD")))")
                                        .font(Theme.caption)
                                        .foregroundStyle(Theme.textMuted)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                        .cardStyle()
                    }

                    // Current CMC holdings
                    if !isImported {
                        let existing = CMCStorage.load()
                        if !existing.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Text("CURRENT CMC HOLDINGS")
                                        .font(Theme.caption)
                                        .foregroundStyle(Theme.textMuted)
                                        .tracking(1.2)
                                    Spacer()
                                    Button {
                                        CMCStorage.clear()
                                        onImport()
                                        dismiss()
                                    } label: {
                                        Text("CLEAR")
                                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                                            .foregroundStyle(Theme.red)
                                    }
                                }

                                ForEach(existing) { h in
                                    HStack {
                                        Text(h.sym)
                                            .font(Theme.mono)
                                            .foregroundStyle(Theme.textPrimary)
                                        Text(h.name)
                                            .font(Theme.caption)
                                            .foregroundStyle(Theme.textMuted)
                                            .lineLimit(1)
                                        Spacer()
                                        Text("×\(h.qty.formatted(.number.precision(.fractionLength(0...2))))")
                                            .font(Theme.caption)
                                            .foregroundStyle(Theme.textSecondary)
                                    }
                                    .padding(.vertical, 2)
                                }
                            }
                            .cardStyle()
                        }
                    }
                }
                .padding(Theme.paddingMd)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("CMC Import")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Theme.green)
                }
            }
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [.commaSeparatedText, .plainText],
                allowsMultipleSelection: false
            ) { result in
                handleFileImport(result)
            }
        }
    }

    private func instructionRow(step: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(step)
                .font(.system(size: 12, weight: .bold, design: .monospaced))
                .foregroundStyle(Theme.green)
                .frame(width: 20, height: 20)
                .background(Theme.green.opacity(0.15))
                .clipShape(Circle())
            Text(text)
                .font(Theme.body)
                .foregroundStyle(Theme.textSecondary)
        }
    }

    private func handleFileImport(_ result: Result<[URL], Error>) {
        error = nil
        isImported = false

        switch result {
        case .success(let urls):
            guard let url = urls.first else {
                error = "No file selected"
                return
            }

            // Start accessing security-scoped resource
            guard url.startAccessingSecurityScopedResource() else {
                error = "Unable to access file"
                return
            }
            defer { url.stopAccessingSecurityScopedResource() }

            do {
                let text = try String(contentsOf: url, encoding: .utf8)
                let parsed = try CMCParser.parse(text)
                CMCStorage.save(parsed)
                holdings = parsed
                importedCount = parsed.count
                isImported = true
                onImport()
            } catch {
                self.error = error.localizedDescription
            }

        case .failure(let err):
            error = err.localizedDescription
        }
    }
}
