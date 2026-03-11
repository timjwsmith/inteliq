import Foundation

/// A CMC Invest holding parsed from CSV
struct CMCHolding: Codable, Identifiable {
    var id: String { sym }

    let sym: String
    let name: String
    let qty: Double
    let avg: Double
    let avgCurrency: String
    let priceCurrency: String
    let sector: String
    let horizon: String
    let priceType: String
    let source: String
    let rawCode: String
}

// MARK: - CSV Parser

enum CMCParser {
    static func parse(_ text: String) throws -> [CMCHolding] {
        let lines = text.trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: .newlines)

        guard lines.count >= 2 else {
            throw CMCError.emptyCSV
        }

        // Parse headers — strip BOM if present
        let headerLine = lines[0].replacingOccurrences(of: "\u{FEFF}", with: "")
        let headers = headerLine.split(separator: ",").map {
            $0.trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "\"", with: "")
        }

        func idx(_ name: String) -> Int? {
            headers.firstIndex(of: name)
        }

        guard let iCode = idx("Security Code"),
              let iQty = idx("Quantity"),
              let iAvg = idx("Average Cost $") else {
            throw CMCError.unrecognisedFormat
        }

        let iSector = idx("Sector")
        let iName = idx("Company Name")

        var holdings: [CMCHolding] = []

        for i in 1..<lines.count {
            let line = lines[i].trimmingCharacters(in: .whitespaces)
            if line.isEmpty { continue }

            // Parse CSV respecting quoted fields
            let cols = parseCSVLine(line)

            let rawCode = cols.safe(iCode) ?? ""
            let qty = Double(cols.safe(iQty) ?? "") ?? 0
            let avgAUD = Double(cols.safe(iAvg) ?? "") ?? 0

            guard !rawCode.isEmpty, qty > 0, !avgAUD.isNaN else { continue }

            let isUS = rawCode.range(of: #":\s*US$"#, options: .regularExpression, range: nil, locale: nil) != nil
            var sym = rawCode.replacingOccurrences(of: #":US$"#, with: "", options: .regularExpression)
                .trimmingCharacters(in: .whitespaces)
            if !isUS && !sym.hasSuffix(".AX") {
                sym += ".AX"
            }

            let name = cols.safe(iName.map { $0 } ?? -1) ?? sym
            let sector = cols.safe(iSector.map { $0 } ?? -1) ?? "Unknown"

            holdings.append(CMCHolding(
                sym: sym,
                name: name,
                qty: qty,
                avg: avgAUD,
                avgCurrency: "AUD",
                priceCurrency: isUS ? "USD" : "AUD",
                sector: sector,
                horizon: "Medium",
                priceType: "stock",
                source: "cmc",
                rawCode: rawCode
            ))
        }

        guard !holdings.isEmpty else {
            throw CMCError.noValidHoldings
        }

        return holdings
    }

    private static func parseCSVLine(_ line: String) -> [String] {
        var cols: [String] = []
        var current = ""
        var inQuotes = false

        for ch in line {
            if ch == "\"" {
                inQuotes.toggle()
            } else if ch == "," && !inQuotes {
                cols.append(current.trimmingCharacters(in: .whitespaces))
                current = ""
            } else {
                current.append(ch)
            }
        }
        cols.append(current.trimmingCharacters(in: .whitespaces))
        return cols
    }
}

private extension Array where Element == String {
    func safe(_ index: Int) -> String? {
        guard index >= 0 && index < count else { return nil }
        return self[index]
    }
}

private extension Optional where Wrapped == Int {
    func map(_ transform: (Int) -> Int) -> Int {
        switch self {
        case .some(let val): return transform(val)
        case .none: return -1
        }
    }
}

enum CMCError: LocalizedError {
    case emptyCSV
    case unrecognisedFormat
    case noValidHoldings

    var errorDescription: String? {
        switch self {
        case .emptyCSV: return "Empty CSV file"
        case .unrecognisedFormat: return "Unrecognised format — expected CMC Invest Portfolio Report CSV"
        case .noValidHoldings: return "No valid holdings found in CSV"
        }
    }
}
