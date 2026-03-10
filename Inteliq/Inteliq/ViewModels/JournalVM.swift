import Foundation

@Observable
final class JournalVM {
    // MARK: - Persisted entries
    var entries: [JournalEntry] = []

    // MARK: - Analysis state
    var analysis: JournalAnalysis?
    var isAnalysing = false
    var error: String?

    // MARK: - Form state
    var formDate = Date()
    var formSym = ""
    var formAction = "BUY"
    var formQty = ""
    var formPrice = ""
    var formCurrency = "USD"
    var formThesis = ""

    var canAnalyse: Bool { entries.count >= 3 }

    private let storageKey = "inteliq_journal"

    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    init() {
        loadEntries()
    }

    // MARK: - Persistence

    private func loadEntries() {
        guard let data = UserDefaults.standard.data(forKey: storageKey) else { return }
        entries = (try? decoder.decode([JournalEntry].self, from: data)) ?? []
    }

    private func saveEntries() {
        if let data = try? encoder.encode(entries) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    // MARK: - CRUD

    func addEntry() {
        guard !formSym.isEmpty,
              let qty = Double(formQty), qty > 0,
              let price = Double(formPrice), price > 0 else { return }

        let entry = JournalEntry(
            id: UUID(),
            date: formDate,
            sym: formSym.uppercased().trimmingCharacters(in: .whitespaces),
            action: formAction,
            qty: qty,
            price: price,
            currency: formCurrency,
            thesis: formThesis.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        entries.insert(entry, at: 0)
        saveEntries()
        resetForm()
    }

    func deleteEntry(id: UUID) {
        entries.removeAll { $0.id == id }
        saveEntries()
    }

    func closeTrade(id: UUID, exitPrice: Double) {
        guard let idx = entries.firstIndex(where: { $0.id == id }) else { return }
        entries[idx].exitPrice = exitPrice
        entries[idx].exitDate = Date()
        saveEntries()
    }

    // MARK: - AI Analysis

    func analyse() async {
        isAnalysing = true
        error = nil
        do {
            let body = AnalyseRequest(entries: entries)
            let result: JournalAnalysis = try await APIService.shared.post(
                "/api/journal/analyse",
                body: body
            )
            analysis = result
        } catch {
            self.error = error.localizedDescription
        }
        isAnalysing = false
    }

    // MARK: - Helpers

    private func resetForm() {
        formDate = Date()
        formSym = ""
        formAction = "BUY"
        formQty = ""
        formPrice = ""
        formCurrency = "USD"
        formThesis = ""
    }
}

private struct AnalyseRequest: Encodable {
    let entries: [JournalEntry]
}
