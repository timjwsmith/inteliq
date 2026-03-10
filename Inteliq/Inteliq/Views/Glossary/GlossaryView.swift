import SwiftUI

// MARK: - Glossary Term Model

struct GlossaryTerm: Identifiable {
    let id = UUID()
    let term: String
    let definition: String
}

// MARK: - Glossary Data

struct GlossaryData {
    static let terms: [GlossaryTerm] = [
        GlossaryTerm(term: "Accumulation", definition: "A phase where informed investors quietly buy shares over time, often before a significant price move upward."),
        GlossaryTerm(term: "Alpha", definition: "The excess return of an investment relative to its benchmark index. Positive alpha means the investment outperformed."),
        GlossaryTerm(term: "Altcoin", definition: "Any cryptocurrency other than Bitcoin. Examples include Ethereum, Solana, and Cardano."),
        GlossaryTerm(term: "ASX", definition: "The Australian Securities Exchange, the primary stock exchange in Australia where shares, ETFs, and other securities are traded."),
        GlossaryTerm(term: "ATH", definition: "All-Time High — the highest price a security has ever reached in its trading history."),
        GlossaryTerm(term: "ATL", definition: "All-Time Low — the lowest price a security has ever reached in its trading history."),
        GlossaryTerm(term: "Bag Holder", definition: "An investor who continues to hold a losing position long after its value has declined significantly, often hoping for a recovery."),
        GlossaryTerm(term: "Bear Market", definition: "A prolonged period of declining prices, typically defined as a drop of 20% or more from recent highs. Characterised by pessimism and widespread selling."),
        GlossaryTerm(term: "Beta", definition: "A measure of a stock's volatility relative to the overall market. A beta above 1 means the stock is more volatile than the market; below 1 means less volatile."),
        GlossaryTerm(term: "Bid-Ask Spread", definition: "The difference between the highest price a buyer will pay (bid) and the lowest price a seller will accept (ask). A tighter spread indicates higher liquidity."),
        GlossaryTerm(term: "Blockchain", definition: "A decentralised, immutable digital ledger that records transactions across a network of computers. The underlying technology behind cryptocurrencies."),
        GlossaryTerm(term: "Bollinger Bands", definition: "A technical indicator consisting of a middle moving average band with upper and lower bands set at standard deviations. Used to identify overbought/oversold conditions and volatility."),
        GlossaryTerm(term: "Book Value", definition: "The net asset value of a company calculated as total assets minus total liabilities. Often compared to market price to assess whether a stock is undervalued."),
        GlossaryTerm(term: "Breakout", definition: "When a stock's price moves above a defined resistance level or below a support level with increased volume, often signalling the start of a new trend."),
        GlossaryTerm(term: "Bull Market", definition: "A prolonged period of rising prices, typically defined as a gain of 20% or more from recent lows. Characterised by optimism and strong buying activity."),
        GlossaryTerm(term: "Buyback", definition: "When a company repurchases its own shares from the open market, reducing the number of outstanding shares and often boosting earnings per share."),
        GlossaryTerm(term: "Call Option", definition: "A contract giving the holder the right, but not the obligation, to buy an asset at a specified strike price before the expiry date."),
        GlossaryTerm(term: "Candlestick", definition: "A chart element showing the open, high, low, and close prices for a given time period. The body shows open-to-close range; wicks show the high and low."),
        GlossaryTerm(term: "CGT", definition: "Capital Gains Tax — the tax paid on the profit from selling an investment. In Australia, assets held over 12 months may qualify for a 50% CGT discount."),
        GlossaryTerm(term: "CHESS", definition: "Clearing House Electronic Subregister System — the electronic settlement system used by the ASX to record share ownership and process trades."),
        GlossaryTerm(term: "Circuit Breaker", definition: "An automatic mechanism that temporarily halts trading on an exchange when prices fall by a specified percentage, designed to prevent panic selling."),
        GlossaryTerm(term: "Consolidation", definition: "A period where a stock's price trades within a narrow range after a significant move, indicating indecision before the next directional breakout."),
        GlossaryTerm(term: "Consumer Confidence", definition: "An economic indicator measuring how optimistic consumers feel about the economy and their personal finances. Higher confidence typically supports spending and stock prices."),
        GlossaryTerm(term: "Correction", definition: "A decline of 10% or more from a recent peak in a stock or index price. Corrections are considered normal and healthy within longer-term uptrends."),
        GlossaryTerm(term: "Correlation", definition: "A statistical measure of how two assets move in relation to each other. A correlation of +1 means they move together; -1 means they move in opposite directions."),
        GlossaryTerm(term: "Cost Basis", definition: "The original purchase price of an investment, including commissions and fees. Used to calculate capital gains or losses when the investment is sold."),
        GlossaryTerm(term: "Covered Call", definition: "An options strategy where an investor sells call options on shares they already own, generating income from the premium while capping upside potential."),
        GlossaryTerm(term: "CPI", definition: "Consumer Price Index — a measure of the average change in prices paid by consumers for goods and services. A key indicator of inflation."),
        GlossaryTerm(term: "Cup and Handle", definition: "A bullish chart pattern resembling a teacup, where the price forms a rounded bottom (cup) followed by a smaller consolidation (handle) before breaking out higher."),
        GlossaryTerm(term: "Dark Pool", definition: "A private trading venue where large institutional orders are executed anonymously, away from public exchanges, to minimise market impact."),
        GlossaryTerm(term: "Day Trading", definition: "The practice of buying and selling securities within the same trading day, closing all positions before the market closes to avoid overnight risk."),
        GlossaryTerm(term: "DCF", definition: "Discounted Cash Flow — a valuation method that estimates a company's value by projecting future cash flows and discounting them back to present value."),
        GlossaryTerm(term: "Death Cross", definition: "A bearish technical signal that occurs when the 50-day moving average crosses below the 200-day moving average, often interpreted as a sign of further decline."),
        GlossaryTerm(term: "Debt-to-Equity", definition: "A financial ratio comparing a company's total debt to shareholder equity. A higher ratio indicates more leverage and potentially higher financial risk."),
        GlossaryTerm(term: "DeFi", definition: "Decentralised Finance — financial services built on blockchain technology that operate without traditional intermediaries like banks or brokers."),
        GlossaryTerm(term: "Delta", definition: "An options metric measuring how much an option's price changes for every $1 change in the underlying asset. A delta of 0.5 means the option moves $0.50 per $1."),
        GlossaryTerm(term: "Derivatives", definition: "Financial contracts whose value is derived from an underlying asset such as stocks, bonds, commodities, or indices. Options and futures are common examples."),
        GlossaryTerm(term: "Dilution", definition: "A reduction in existing shareholders' ownership percentage caused by the issuance of new shares, such as through stock offerings or employee options."),
        GlossaryTerm(term: "Distribution", definition: "A phase where informed investors gradually sell their holdings, often occurring at market tops before a significant price decline."),
        GlossaryTerm(term: "Divergence", definition: "When the price of an asset moves in the opposite direction to a technical indicator like RSI or MACD. Often signals a potential trend reversal."),
        GlossaryTerm(term: "Diversification", definition: "The practice of spreading investments across different assets, sectors, or geographies to reduce risk. Aims to ensure no single position dominates losses."),
        GlossaryTerm(term: "Dividend Yield", definition: "The annual dividend payment divided by the stock's current price, expressed as a percentage. A 4% yield means $4 in annual dividends per $100 invested."),
        GlossaryTerm(term: "Doji", definition: "A candlestick pattern where the open and close prices are nearly equal, forming a cross shape. Signals indecision and a potential reversal."),
        GlossaryTerm(term: "Dollar Cost Averaging", definition: "An investment strategy where you invest a fixed amount at regular intervals regardless of price, reducing the impact of volatility over time."),
        GlossaryTerm(term: "Double Bottom", definition: "A bullish chart pattern where the price drops to a support level twice with a moderate rise between, forming a W shape that signals a trend reversal upward."),
        GlossaryTerm(term: "Double Top", definition: "A bearish chart pattern where the price reaches a resistance level twice with a moderate decline between, forming an M shape that signals a trend reversal downward."),
        GlossaryTerm(term: "Dovish", definition: "Describes a central bank stance favouring lower interest rates and stimulative monetary policy to support economic growth, even at the risk of higher inflation."),
        GlossaryTerm(term: "Dow Jones", definition: "The Dow Jones Industrial Average (DJIA), a price-weighted index tracking 30 large US blue-chip companies. One of the oldest and most-watched market benchmarks."),
        GlossaryTerm(term: "Drawdown", definition: "The peak-to-trough decline in a portfolio or asset's value before a new high is reached. Maximum drawdown measures the worst historical decline."),
        GlossaryTerm(term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation, and Amortisation — a measure of a company's operating profitability that strips out non-cash and financing costs."),
        GlossaryTerm(term: "EMA", definition: "Exponential Moving Average — a type of moving average that gives greater weight to recent prices, making it more responsive to new information than a simple moving average."),
        GlossaryTerm(term: "Engulfing Pattern", definition: "A two-candle reversal pattern where the second candle's body completely engulfs the first. A bullish engulfing signals a potential upward reversal; bearish signals downward."),
        GlossaryTerm(term: "Enterprise Value", definition: "A company's total value including market capitalisation, debt, and preferred shares, minus cash. Often considered a more complete valuation metric than market cap alone."),
        GlossaryTerm(term: "EPS", definition: "Earnings Per Share — a company's net profit divided by the number of outstanding shares. A key metric for comparing profitability across companies."),
        GlossaryTerm(term: "ETF", definition: "Exchange-Traded Fund — a basket of securities that trades on an exchange like a stock. ETFs offer diversification and typically track an index, sector, or theme."),
        GlossaryTerm(term: "Ex-Dividend Date", definition: "The date on which a stock begins trading without the right to receive the next dividend payment. You must own shares before this date to receive the dividend."),
        GlossaryTerm(term: "Expiry", definition: "The date on which an options or futures contract expires and becomes void. After expiry, unexercised options are worthless."),
        GlossaryTerm(term: "Fear and Greed Index", definition: "A sentiment indicator that measures market emotions on a scale from extreme fear to extreme greed using factors like volatility, momentum, and safe-haven demand."),
        GlossaryTerm(term: "Fed Funds Rate", definition: "The interest rate at which US banks lend to each other overnight, set by the Federal Reserve. It influences borrowing costs throughout the economy."),
        GlossaryTerm(term: "Fibonacci Retracement", definition: "A technical tool that uses horizontal lines at key Fibonacci ratios (23.6%, 38.2%, 50%, 61.8%) to identify potential support and resistance levels during a pullback."),
        GlossaryTerm(term: "FIFO", definition: "First In, First Out — an accounting method that assumes the earliest purchased shares are sold first when calculating capital gains or losses."),
        GlossaryTerm(term: "Flight to Safety", definition: "A market phenomenon where investors shift capital from risky assets into safer ones like government bonds or gold during periods of uncertainty or crisis."),
        GlossaryTerm(term: "Float", definition: "The number of a company's shares that are freely available for public trading, excluding restricted shares held by insiders and large institutions."),
        GlossaryTerm(term: "Forward P/E", definition: "The price-to-earnings ratio calculated using estimated future earnings rather than trailing earnings. Useful for comparing a stock's valuation against expected growth."),
        GlossaryTerm(term: "Franking Credits", definition: "Tax credits attached to dividends paid by Australian companies that have already paid corporate tax. They reduce or eliminate double taxation for shareholders."),
        GlossaryTerm(term: "Free Cash Flow", definition: "The cash a company generates after accounting for capital expenditures. Represents the money available for dividends, buybacks, debt repayment, or reinvestment."),
        GlossaryTerm(term: "Futures", definition: "Standardised contracts to buy or sell an asset at a predetermined price on a specific future date. Used for hedging and speculation on commodities, indices, and more."),
        GlossaryTerm(term: "Gamma", definition: "An options metric measuring the rate of change of delta. High gamma means an option's delta is very sensitive to movements in the underlying asset."),
        GlossaryTerm(term: "Gas Fee", definition: "The transaction fee paid to validators on a blockchain network like Ethereum. Gas fees fluctuate based on network congestion and demand for block space."),
        GlossaryTerm(term: "GDP", definition: "Gross Domestic Product — the total value of goods and services produced in a country over a specific period. The broadest measure of economic activity."),
        GlossaryTerm(term: "Golden Cross", definition: "A bullish technical signal that occurs when the 50-day moving average crosses above the 200-day moving average, often interpreted as the start of a sustained uptrend."),
        GlossaryTerm(term: "Gross Margin", definition: "Revenue minus the cost of goods sold, divided by revenue and expressed as a percentage. Indicates how efficiently a company produces its goods."),
        GlossaryTerm(term: "Growth Investing", definition: "An investment strategy focused on companies expected to grow revenue and earnings faster than the market average, often trading at higher valuations."),
        GlossaryTerm(term: "Halving", definition: "An event in Bitcoin's protocol that halves the mining reward approximately every four years, reducing the rate of new supply and historically preceding price increases."),
        GlossaryTerm(term: "Hammer", definition: "A bullish candlestick pattern with a small body at the top and a long lower wick, signalling that sellers pushed the price down but buyers regained control."),
        GlossaryTerm(term: "Hawkish", definition: "Describes a central bank stance favouring higher interest rates and tighter monetary policy to combat inflation, even at the cost of slower economic growth."),
        GlossaryTerm(term: "Head and Shoulders", definition: "A bearish reversal chart pattern with three peaks — the middle peak (head) is the highest, flanked by two lower peaks (shoulders). A break below the neckline confirms the pattern."),
        GlossaryTerm(term: "Hedge Fund", definition: "A pooled investment fund that uses advanced strategies including leverage, short selling, and derivatives to generate returns for accredited investors."),
        GlossaryTerm(term: "HODL", definition: "Crypto slang for holding an asset long-term regardless of price volatility. Originated from a misspelling of 'hold' in a 2013 Bitcoin forum post."),
        GlossaryTerm(term: "Implied Volatility", definition: "The market's expectation of future price volatility, derived from options prices. Higher implied volatility means options are more expensive and larger moves are expected."),
        GlossaryTerm(term: "In the Money", definition: "An option with intrinsic value — a call option where the underlying price is above the strike price, or a put option where it is below."),
        GlossaryTerm(term: "Index Fund", definition: "A type of mutual fund or ETF designed to replicate the performance of a specific market index like the S&P 500, offering broad diversification at low cost."),
        GlossaryTerm(term: "Inflation", definition: "The rate at which the general level of prices for goods and services rises, eroding purchasing power over time. Central banks aim to keep inflation around 2-3%."),
        GlossaryTerm(term: "Insider Trading", definition: "Buying or selling securities based on material non-public information. Illegal insider trading is a serious offence; legal insider trading by executives must be disclosed."),
        GlossaryTerm(term: "Institutional Ownership", definition: "The percentage of a company's shares held by large organisations like mutual funds, pension funds, and hedge funds. High institutional ownership can signal confidence."),
        GlossaryTerm(term: "Intrinsic Value", definition: "The estimated true value of a company based on fundamentals like cash flows, growth, and assets, independent of its current market price."),
        GlossaryTerm(term: "Inverted Yield Curve", definition: "When short-term bond yields exceed long-term yields, historically a reliable predictor of economic recession. It signals that investors expect weaker future growth."),
        GlossaryTerm(term: "IPO", definition: "Initial Public Offering — the first time a private company sells shares to the public on a stock exchange, allowing it to raise capital from public investors."),
        GlossaryTerm(term: "Leverage", definition: "Using borrowed money or financial instruments to amplify potential returns. While it can magnify gains, it equally magnifies losses and increases risk."),
        GlossaryTerm(term: "LIFO", definition: "Last In, First Out — an accounting method that assumes the most recently purchased shares are sold first when calculating capital gains or losses."),
        GlossaryTerm(term: "Limit Order", definition: "An order to buy or sell a security at a specific price or better. A buy limit order executes at or below the set price; a sell limit order at or above."),
        GlossaryTerm(term: "Liquidity", definition: "How easily an asset can be bought or sold without significantly affecting its price. Highly liquid assets like large-cap stocks have narrow bid-ask spreads."),
        GlossaryTerm(term: "MACD", definition: "Moving Average Convergence Divergence — a momentum indicator showing the relationship between two EMAs (typically 12 and 26-day). Crossovers of the MACD and signal lines generate buy/sell signals."),
        GlossaryTerm(term: "Margin", definition: "Borrowed money from a broker used to purchase securities. Margin trading amplifies both gains and losses and requires maintaining a minimum equity balance."),
        GlossaryTerm(term: "Market Cap", definition: "Market Capitalisation — the total market value of a company's outstanding shares, calculated as share price multiplied by total shares. Used to classify companies by size."),
        GlossaryTerm(term: "Market Dominance", definition: "The percentage of the total cryptocurrency market capitalisation represented by a single coin, most commonly Bitcoin. A falling dominance suggests altcoin strength."),
        GlossaryTerm(term: "Market Maker", definition: "A firm that provides liquidity by continuously quoting both buy and sell prices for a security, profiting from the bid-ask spread while facilitating trading."),
        GlossaryTerm(term: "Market Order", definition: "An order to buy or sell a security immediately at the best available current price. Guarantees execution but not the exact price."),
        GlossaryTerm(term: "Mining", definition: "The process of using computational power to validate transactions and add new blocks to a blockchain. Miners are rewarded with newly created cryptocurrency."),
        GlossaryTerm(term: "Momentum Trading", definition: "A strategy that buys securities showing upward price momentum and sells those with downward momentum, based on the idea that trends tend to persist."),
        GlossaryTerm(term: "Moving Average", definition: "A technical indicator that smooths price data by calculating the average price over a specific number of periods, helping identify trends and support/resistance levels."),
        GlossaryTerm(term: "Mutual Fund", definition: "A professionally managed investment fund that pools money from many investors to buy a diversified portfolio of stocks, bonds, or other securities."),
        GlossaryTerm(term: "Naked Short", definition: "Selling shares short without first borrowing them or confirming they can be borrowed. This practice is illegal in most markets due to the risk of settlement failures."),
        GlossaryTerm(term: "NASDAQ", definition: "The National Association of Securities Dealers Automated Quotations — a US electronic stock exchange known for listing technology and growth companies."),
        GlossaryTerm(term: "Net Margin", definition: "Net income divided by revenue, expressed as a percentage. Represents the proportion of revenue that becomes profit after all expenses, taxes, and costs."),
        GlossaryTerm(term: "NFP", definition: "Non-Farm Payrolls — a monthly US employment report measuring the number of jobs added or lost, excluding farm workers. A key indicator of economic health."),
        GlossaryTerm(term: "NYSE", definition: "The New York Stock Exchange — the world's largest stock exchange by market capitalisation, located on Wall Street in New York City."),
        GlossaryTerm(term: "Operating Margin", definition: "Operating income divided by revenue, expressed as a percentage. Measures how much profit a company makes from its core operations before interest and taxes."),
        GlossaryTerm(term: "Options", definition: "Financial contracts giving the holder the right, but not the obligation, to buy (call) or sell (put) an asset at a set price before a specified date."),
        GlossaryTerm(term: "Out of the Money", definition: "An option with no intrinsic value — a call option where the underlying price is below the strike, or a put option where it is above."),
        GlossaryTerm(term: "Overbought", definition: "A condition where a security's price has risen too far, too fast and may be due for a pullback. Often identified when RSI exceeds 70."),
        GlossaryTerm(term: "Oversold", definition: "A condition where a security's price has fallen too far, too fast and may be due for a bounce. Often identified when RSI drops below 30."),
        GlossaryTerm(term: "P/E Ratio", definition: "Price-to-Earnings Ratio — a stock's current price divided by its earnings per share. A widely used valuation metric; higher P/E suggests investors expect higher future growth."),
        GlossaryTerm(term: "PEG Ratio", definition: "Price/Earnings-to-Growth Ratio — the P/E ratio divided by the expected earnings growth rate. A PEG below 1 may indicate a stock is undervalued relative to its growth."),
        GlossaryTerm(term: "PMI", definition: "Purchasing Managers' Index — a monthly survey-based indicator of manufacturing and services sector health. A reading above 50 signals expansion; below 50 signals contraction."),
        GlossaryTerm(term: "Position Sizing", definition: "Determining how much capital to allocate to a single trade based on risk tolerance and account size. Proper sizing helps manage drawdowns and protect capital."),
        GlossaryTerm(term: "PPI", definition: "Producer Price Index — a measure of the average change in selling prices received by domestic producers. A leading indicator of consumer inflation."),
        GlossaryTerm(term: "Put Option", definition: "A contract giving the holder the right, but not the obligation, to sell an asset at a specified strike price before the expiry date. Used for hedging or bearish bets."),
        GlossaryTerm(term: "Quantitative Easing", definition: "A monetary policy where a central bank buys government bonds and other assets to inject money into the economy, lower interest rates, and stimulate lending and investment."),
        GlossaryTerm(term: "Rally", definition: "A sustained increase in the price of a security or market index, often driven by positive news, improved sentiment, or strong economic data."),
        GlossaryTerm(term: "Realised P&L", definition: "Realised Profit and Loss — the actual gain or loss from a trade that has been closed. Only calculated when the position is sold."),
        GlossaryTerm(term: "Rebalancing", definition: "The process of realigning portfolio weights back to target allocations by buying underweight assets and selling overweight ones, typically done periodically."),
        GlossaryTerm(term: "Record Date", definition: "The date set by a company to determine which shareholders are eligible to receive a declared dividend or participate in a corporate action."),
        GlossaryTerm(term: "Resistance", definition: "A price level where selling pressure historically prevents a stock from rising further. Breaking above resistance can signal a bullish breakout."),
        GlossaryTerm(term: "Retail Investor", definition: "An individual, non-professional investor who buys and sells securities through brokerage accounts for personal purposes rather than on behalf of an organisation."),
        GlossaryTerm(term: "Revenue Growth", definition: "The percentage increase in a company's sales over a given period compared to a prior period. Consistent revenue growth is a key indicator of business health."),
        GlossaryTerm(term: "Rights Issue", definition: "An offer to existing shareholders to purchase additional shares at a discount to the current market price, typically to raise capital for the company."),
        GlossaryTerm(term: "Risk-Off", definition: "A market environment where investors reduce exposure to risky assets like equities and crypto, moving capital into safer assets like bonds and cash."),
        GlossaryTerm(term: "Risk-On", definition: "A market environment where investors favour riskier assets like equities, high-yield bonds, and crypto, driven by confidence in economic growth."),
        GlossaryTerm(term: "Risk-Reward Ratio", definition: "The ratio of potential loss to potential gain on a trade. A 1:3 ratio means risking $1 for every $3 of potential profit."),
        GlossaryTerm(term: "ROA", definition: "Return on Assets — net income divided by total assets. Measures how efficiently a company uses its assets to generate profit."),
        GlossaryTerm(term: "ROE", definition: "Return on Equity — net income divided by shareholder equity. Measures how effectively a company generates profit from the money shareholders have invested."),
        GlossaryTerm(term: "RSI", definition: "Relative Strength Index — a momentum oscillator ranging from 0 to 100 that measures the speed and magnitude of price changes. Readings above 70 suggest overbought; below 30 suggest oversold."),
        GlossaryTerm(term: "S&P 500", definition: "Standard & Poor's 500 — a market-cap-weighted index of 500 leading US companies, widely regarded as the best single gauge of the US large-cap equities market."),
        GlossaryTerm(term: "Safe Haven", definition: "An investment expected to retain or increase in value during periods of market turmoil. Gold, US Treasuries, and the Swiss franc are classic safe havens."),
        GlossaryTerm(term: "Scalping", definition: "An ultra-short-term trading strategy that profits from small price changes by executing many trades per day, often holding positions for seconds to minutes."),
        GlossaryTerm(term: "Sector Rotation", definition: "An investment strategy that moves capital between market sectors based on the economic cycle, shifting from defensive sectors in downturns to cyclical sectors in expansions."),
        GlossaryTerm(term: "Sharpe Ratio", definition: "A risk-adjusted return metric calculated as (portfolio return minus risk-free rate) divided by portfolio standard deviation. Higher values indicate better risk-adjusted performance."),
        GlossaryTerm(term: "Short Selling", definition: "Borrowing and selling shares you don't own, hoping to buy them back cheaper later. Profits from price declines but carries unlimited risk if the price rises."),
        GlossaryTerm(term: "SMA", definition: "Simple Moving Average — the average closing price over a specified number of periods, giving equal weight to each data point. Common periods are 20, 50, and 200 days."),
        GlossaryTerm(term: "Smart Money", definition: "Institutional investors, hedge funds, and other professional traders whose moves are thought to reflect superior information or analysis."),
        GlossaryTerm(term: "SPO", definition: "Secondary Public Offering — the sale of new or existing shares by a company that is already publicly listed, used to raise additional capital."),
        GlossaryTerm(term: "Stablecoin", definition: "A cryptocurrency designed to maintain a stable value by being pegged to a reserve asset like the US dollar. Examples include USDT, USDC, and DAI."),
        GlossaryTerm(term: "Staking", definition: "Locking up cryptocurrency in a blockchain network to help validate transactions and earn rewards, similar to earning interest on a deposit."),
        GlossaryTerm(term: "Stock Split", definition: "A corporate action that divides existing shares into multiple new shares, lowering the price per share while maintaining total market value. A 2-for-1 split halves the price."),
        GlossaryTerm(term: "Stop Loss", definition: "An order to automatically sell a security when it reaches a specified price, designed to limit losses on a position."),
        GlossaryTerm(term: "Strike Price", definition: "The fixed price at which the holder of an option can buy (call) or sell (put) the underlying asset when exercising the contract."),
        GlossaryTerm(term: "Support", definition: "A price level where buying pressure historically prevents a stock from falling further. Breaking below support can signal a bearish breakdown."),
        GlossaryTerm(term: "Swing Trading", definition: "A trading style that holds positions for several days to weeks, aiming to capture medium-term price moves using technical and fundamental analysis."),
        GlossaryTerm(term: "Tapering", definition: "The gradual reduction of a central bank's asset purchase program. Tapering signals a shift toward tighter monetary policy and can cause market volatility."),
        GlossaryTerm(term: "Tax Loss Harvesting", definition: "Selling losing investments to offset capital gains and reduce your tax bill. The proceeds can be reinvested in similar but not identical assets."),
        GlossaryTerm(term: "Theta Decay", definition: "The rate at which an option loses value as it approaches expiry, all else being equal. Theta accelerates as expiration nears, eroding the option's time value."),
        GlossaryTerm(term: "Token", definition: "A digital asset created on an existing blockchain, often representing utility, governance rights, or other value within a specific project or ecosystem."),
        GlossaryTerm(term: "Trading Halt", definition: "A temporary suspension of trading in a security, typically triggered by pending news, regulatory concerns, or extreme price volatility."),
        GlossaryTerm(term: "Unemployment Rate", definition: "The percentage of the labour force that is jobless and actively seeking employment. A key economic indicator tracked by central banks and policymakers."),
        GlossaryTerm(term: "Unrealised P&L", definition: "Unrealised Profit and Loss — the paper gain or loss on an open position based on the current market price versus the purchase price."),
        GlossaryTerm(term: "Value Investing", definition: "An investment strategy focused on finding stocks trading below their intrinsic value based on fundamentals, popularised by Benjamin Graham and Warren Buffett."),
        GlossaryTerm(term: "VIX", definition: "The CBOE Volatility Index — a measure of expected 30-day volatility in the S&P 500, often called the 'fear gauge'. Higher values indicate greater expected market turbulence."),
        GlossaryTerm(term: "Volatility", definition: "A statistical measure of how much a security's price fluctuates over time. Higher volatility means larger price swings and greater risk."),
        GlossaryTerm(term: "Volume", definition: "The total number of shares or contracts traded in a security during a given period. High volume confirms price moves; low volume suggests weak conviction."),
        GlossaryTerm(term: "VWAP", definition: "Volume-Weighted Average Price — the average price a security has traded at throughout the day, weighted by volume. Used by institutional traders to gauge execution quality."),
        GlossaryTerm(term: "Whale", definition: "An investor or entity that holds a very large amount of a particular asset, capable of moving the market with a single trade."),
        GlossaryTerm(term: "Yield Curve", definition: "A graph plotting bond yields against their maturities. A normal upward-sloping curve indicates a healthy economy; an inverted curve can signal a coming recession."),
        GlossaryTerm(term: "Yield Farming", definition: "A DeFi strategy where users provide liquidity to decentralised protocols in exchange for rewards, often earning fees and governance tokens."),
    ].sorted { $0.term.localizedCaseInsensitiveCompare($1.term) == .orderedAscending }
}

// MARK: - Glossary View

struct GlossaryView: View {
    @State private var searchText = ""

    private var filteredTerms: [GlossaryTerm] {
        if searchText.isEmpty {
            return GlossaryData.terms
        }
        let query = searchText.lowercased()
        return GlossaryData.terms.filter {
            $0.term.lowercased().contains(query) ||
            $0.definition.lowercased().contains(query)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.paddingMd) {
                LogoHeader()

                Text("Glossary")
                    .font(Theme.headingLg)
                    .foregroundStyle(Theme.textPrimary)

                Text("Look up investing and trading terms with clear, plain-English definitions.")
                    .font(Theme.body)
                    .foregroundStyle(Theme.textSecondary)

                // Search bar
                HStack(spacing: Theme.paddingSm) {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(Theme.textMuted)
                        .font(.system(size: 14))
                    TextField("Search terms...", text: $searchText)
                        .font(Theme.body)
                        .foregroundStyle(Theme.textPrimary)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    if !searchText.isEmpty {
                        Button {
                            searchText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(Theme.textMuted)
                                .font(.system(size: 14))
                        }
                    }
                }
                .padding(Theme.paddingSm + 4)
                .background(Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius))

                // Term count
                Text("\(filteredTerms.count) terms")
                    .font(Theme.caption)
                    .foregroundStyle(Theme.textMuted)

                // Terms list
                if filteredTerms.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 36))
                            .foregroundStyle(Theme.textMuted)
                        Text("No terms found")
                            .font(Theme.heading)
                            .foregroundStyle(Theme.textSecondary)
                        Text("Try a different search query.")
                            .font(Theme.caption)
                            .foregroundStyle(Theme.textMuted)
                    }
                    .frame(maxWidth: .infinity, minHeight: 160)
                    .cardStyle()
                } else {
                    LazyVStack(alignment: .leading, spacing: 10) {
                        ForEach(filteredTerms) { term in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(term.term)
                                    .font(Theme.bodyMed)
                                    .foregroundStyle(Theme.green)
                                Text(term.definition)
                                    .font(Theme.caption)
                                    .foregroundStyle(Theme.textSecondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .cardStyle()
                        }
                    }
                }
            }
            .padding(Theme.paddingMd)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
    }
}
