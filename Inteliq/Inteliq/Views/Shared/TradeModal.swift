import SwiftUI

struct TradeModal: View {
    let sym: String
    let name: String
    let priceType: String       // "crypto" or "stock"
    let source: String?         // "coinbase", "binance", "tiger", or nil for explorer
    let livePrice: Double?

    @Environment(\.dismiss) private var dismiss
    @State private var side: TradeSide = .buy
    @State private var amount = ""
    @State private var qty = ""
    @State private var limitPrice = ""
    @State private var orderType: OrderType = .market
    @State private var buyingPower: Double?
    @State private var buyingPowerCurrency = "USD"
    @State private var isLoading = false
    @State private var resultMessage: String?
    @State private var resultIsError = false
    @State private var selectedExchange: Exchange

    init(sym: String, name: String, priceType: String, source: String?, livePrice: Double?) {
        self.sym = sym
        self.name = name
        self.priceType = priceType
        self.source = source
        self.livePrice = livePrice
        // Default exchange based on source or asset type
        if let source {
            _selectedExchange = State(initialValue: Exchange(rawValue: source) ?? .coinbase)
        } else if priceType == "stock" {
            _selectedExchange = State(initialValue: .tiger)
        } else {
            _selectedExchange = State(initialValue: .coinbase)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Symbol header
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(sym)
                                .font(.system(size: 24, weight: .bold))
                                .foregroundStyle(Theme.textPrimary)
                            Text(name)
                                .font(Theme.body)
                                .foregroundStyle(Theme.textSecondary)
                        }
                        Spacer()
                        if let price = livePrice, price > 0 {
                            Text(price.asCurrency())
                                .font(Theme.mono)
                                .foregroundStyle(Theme.textPrimary)
                        }
                    }

                    // Exchange selector
                    VStack(alignment: .leading, spacing: 6) {
                        Text("EXCHANGE")
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                            .foregroundStyle(Theme.textMuted)
                        HStack(spacing: 8) {
                            ForEach(availableExchanges, id: \.self) { exchange in
                                Button {
                                    selectedExchange = exchange
                                    Task { await loadBuyingPower() }
                                } label: {
                                    Text(exchange.displayName)
                                        .font(.system(size: 12, weight: .semibold))
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 8)
                                        .background(selectedExchange == exchange ? Theme.green.opacity(0.2) : Theme.card)
                                        .foregroundStyle(selectedExchange == exchange ? Theme.green : Theme.textSecondary)
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    }

                    // Buying power
                    if let bp = buyingPower {
                        HStack {
                            Text("Available:")
                                .font(Theme.caption)
                                .foregroundStyle(Theme.textMuted)
                            Text("\(buyingPowerCurrency) \(bp.formatted(.number.precision(.fractionLength(2))))")
                                .font(Theme.mono)
                                .foregroundStyle(Theme.green)
                        }
                        .padding(10)
                        .background(Theme.green.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Buy / Sell toggle
                    HStack(spacing: 0) {
                        SideButton(label: "BUY", isSelected: side == .buy, color: Theme.green) {
                            side = .buy
                        }
                        SideButton(label: "SELL", isSelected: side == .sell, color: Theme.red) {
                            side = .sell
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                    // Order type (Tiger stocks need limit for ASX)
                    if selectedExchange == .tiger {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("ORDER TYPE")
                                .font(.system(size: 10, weight: .medium, design: .monospaced))
                                .foregroundStyle(Theme.textMuted)
                            HStack(spacing: 8) {
                                OrderTypeButton(label: "MARKET", isSelected: orderType == .market) { orderType = .market }
                                OrderTypeButton(label: "LIMIT", isSelected: orderType == .limit) { orderType = .limit }
                            }
                        }

                        if orderType == .limit || isASX {
                            TradeTextField(label: "LIMIT PRICE", text: $limitPrice, placeholder: livePrice.map { String(format: "%.2f", $0) } ?? "0.00")
                        }

                        TradeTextField(label: "QUANTITY", text: $qty, placeholder: "0")
                    } else {
                        // Crypto exchanges — amount in quote currency
                        if side == .buy {
                            TradeTextField(label: "AMOUNT (\(buyingPowerCurrency))", text: $amount, placeholder: "0.00")
                        } else {
                            TradeTextField(label: "QUANTITY", text: $qty, placeholder: "0.00")
                        }
                    }

                    // ASX warning
                    if isASX {
                        HStack(spacing: 6) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(Theme.amber)
                                .font(.system(size: 12))
                            Text("ASX requires limit orders. Min A$500 initial investment.")
                                .font(Theme.caption)
                                .foregroundStyle(Theme.amber)
                        }
                        .padding(10)
                        .background(Theme.amber.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Result message
                    if let msg = resultMessage {
                        Text(msg)
                            .font(Theme.body)
                            .foregroundStyle(resultIsError ? Theme.red : Theme.green)
                            .padding(12)
                            .background((resultIsError ? Theme.red : Theme.green).opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }

                    // Submit button
                    Button {
                        Task { await submitOrder() }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView().tint(side == .buy ? Theme.bg : .white).controlSize(.small)
                            }
                            Text(isLoading ? "PLACING ORDER..." : "\(side == .buy ? "BUY" : "SELL") \(sym)")
                                .font(.system(size: 14, weight: .bold, design: .monospaced))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(side == .buy ? Theme.green : Theme.red)
                        .foregroundStyle(side == .buy ? Theme.bg : .white)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(isLoading)
                }
                .padding(Theme.paddingMd)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("Trade")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.textSecondary)
                }
            }
            .task { await loadBuyingPower() }
        }
    }

    // MARK: - Computed

    private var isASX: Bool {
        sym.hasSuffix(".AX") || sym.hasSuffix(".AU")
    }

    private var availableExchanges: [Exchange] {
        if priceType == "stock" {
            return [.tiger]
        } else {
            return [.coinbase, .binance]
        }
    }

    // MARK: - Network

    private func loadBuyingPower() async {
        do {
            switch selectedExchange {
            case .coinbase:
                let data: CoinbaseBalance = try await APIService.shared.get("/api/coinbase/usd-balance")
                buyingPower = data.available
                buyingPowerCurrency = "USD"
            case .binance:
                let data: BinanceBalance = try await APIService.shared.get("/api/binance/usdt-balance")
                buyingPower = data.available
                buyingPowerCurrency = "USDT"
            case .tiger:
                let data: TigerAssets = try await APIService.shared.get("/api/tiger/assets")
                buyingPower = data.buyingPower
                buyingPowerCurrency = data.currency
            }
        } catch {}
    }

    private func submitOrder() async {
        isLoading = true
        resultMessage = nil
        do {
            switch selectedExchange {
            case .coinbase:
                let body = CoinbaseOrderRequest(
                    sym: sym,
                    side: side.rawValue,
                    quoteSize: side == .buy ? amount : nil,
                    baseSize: side == .sell ? qty : nil
                )
                let result: OrderResult = try await APIService.shared.post("/api/coinbase/order", body: body)
                resultMessage = result.message ?? "Order placed successfully"
                resultIsError = false
            case .binance:
                let body = BinanceOrderRequest(
                    sym: sym,
                    side: side.rawValue,
                    quoteAmount: side == .buy ? Double(amount) : nil,
                    qty: side == .sell ? Double(qty) : nil
                )
                let result: OrderResult = try await APIService.shared.post("/api/binance/order", body: body)
                resultMessage = result.message ?? "Order placed successfully"
                resultIsError = false
            case .tiger:
                let body = TigerOrderRequest(
                    sym: sym,
                    side: side.rawValue.uppercased(),
                    qty: Int(qty) ?? 0,
                    orderType: (isASX || orderType == .limit) ? "LMT" : "MKT",
                    limitPrice: Double(limitPrice),
                    livePrice: livePrice
                )
                let result: OrderResult = try await APIService.shared.post("/api/tiger/order", body: body)
                resultMessage = result.message ?? "Order placed successfully"
                resultIsError = false
            }
        } catch {
            resultMessage = error.localizedDescription
            resultIsError = true
        }
        isLoading = false
    }
}

// MARK: - Sub-views

struct SideButton: View {
    let label: String
    let isSelected: Bool
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(isSelected ? color : Theme.card)
                .foregroundStyle(isSelected ? (color == Theme.green ? Theme.bg : .white) : Theme.textMuted)
        }
    }
}

struct OrderTypeButton: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Theme.blue.opacity(0.2) : Theme.card)
                .foregroundStyle(isSelected ? Theme.blue : Theme.textMuted)
                .clipShape(Capsule())
        }
    }
}

struct TradeTextField: View {
    let label: String
    @Binding var text: String
    let placeholder: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.textMuted)
            TextField(placeholder, text: $text)
                .font(Theme.mono)
                .foregroundStyle(Theme.textPrimary)
                .keyboardType(.decimalPad)
                .padding(12)
                .background(Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

// MARK: - Types

enum TradeSide: String {
    case buy = "BUY"
    case sell = "SELL"
}

enum OrderType {
    case market, limit
}

enum Exchange: String {
    case coinbase, binance, tiger

    var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - API Models

struct CoinbaseBalance: Codable {
    let available: Double
    let availableAUD: Double?
    let availableUSDC: Double?
}

struct BinanceBalance: Codable {
    let available: Double
}

struct TigerAssets: Codable {
    let buyingPower: Double
    let cashBalance: Double?
    let currency: String
}

struct CoinbaseOrderRequest: Encodable {
    let sym: String
    let side: String
    let quoteSize: String?
    let baseSize: String?
}

struct BinanceOrderRequest: Encodable {
    let sym: String
    let side: String
    let quoteAmount: Double?
    let qty: Double?
}

struct TigerOrderRequest: Encodable {
    let sym: String
    let side: String
    let qty: Int
    let orderType: String
    let limitPrice: Double?
    let livePrice: Double?
}

struct OrderResult: Codable {
    let message: String?
    let error: String?
    let orderId: String?
    let filledSize: String?
    let filledPrice: String?

    // Accept any key since different exchanges return different shapes
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: DynamicKey.self)
        message = try? container.decode(String.self, forKey: DynamicKey(stringValue: "message")!)
        error = try? container.decode(String.self, forKey: DynamicKey(stringValue: "error")!)
        orderId = try? container.decode(String.self, forKey: DynamicKey(stringValue: "orderId")!)
            ?? (try? container.decode(String.self, forKey: DynamicKey(stringValue: "order_id")!))
        filledSize = try? container.decode(String.self, forKey: DynamicKey(stringValue: "filledSize")!)
        filledPrice = try? container.decode(String.self, forKey: DynamicKey(stringValue: "filledPrice")!)
    }
}

struct DynamicKey: CodingKey {
    var stringValue: String
    var intValue: Int?
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { self.stringValue = "\(intValue)"; self.intValue = intValue }
}
