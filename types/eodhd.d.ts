// ~/types/eodhd.ts
/* ----------------------------------------------------
   1. Live / delayed quotes  (GET /real-time/{symbol})
   -------------------------------------------------- */
export interface LiveQuote {
  code: string // "AAPL.US"
  name?: string // "Apple Inc"
  timestamp: number // 1719403800  (Unix, seconds)
  gmtoffset?: number // -14400
  open: number
  high: number
  low: number
  close: number
  volume: number
  previousClose?: number
  change: number // close - previousClose
  change_p: number // % change
}

/** One call can return one Quote _or_ an array when you use s= */
export type QuoteResponse = Quote | Quote[]

/* ----------------------------------------------------
   2. End-of-Day candles      (GET /eod/{symbol})
   -------------------------------------------------- */
export interface HistoricalQuote {
  date: string // "2025-07-09"
  open: number
  high: number
  low: number
  close: number
  adjusted_close: number
  volume: number
}

/* ----------------------------------------------------
   3. Corporate actions      (GET /div/{symbol})
   -------------------------------------------------- */
export type CorpActionType = 'DIVIDEND' | 'SPLIT'

export interface CorporateAction {
  date: string // "2025-06-15"
  type: CorpActionType
  value: string // "0.22" (dividend per share) OR "3:2" (split ratio)
}

/* ----------------------------------------------------
   4. Financial news         (GET /news)
   -------------------------------------------------- */
export interface NewsItem {
  id: string // unique EODHD id
  title: string
  content: string
  link: string
  source: string // "Reuters", "CNBC"...
  date: string // RFC3339
  sentiment?: {
    polarity: 'positive' | 'negative' | 'neutral'
    score: number // -1->1
  }
}

/* ----------------------------------------------------
   5. Exchange metadata      (GET /exchanges-list)
   -------------------------------------------------- */
export interface Exchange {
  Code: string // "US"
  Name: string // "US Composite"
  Country: string // "USA"
  Currency: string // "USD"
  OperatingMIC?: string // "XNAS"
}

/* ----------------------------------------------------
   6. Tickers per exchange   (GET /exchange-symbol-list/{code})
   -------------------------------------------------- */
export interface TickerMeta {
  Code: string // "AAPL"
  Name: string // "Apple Inc"
  Exchange: string // "US"
  ISIN: string // "US0378331005"
  isPrimary: boolean
  Country: string
  Type: 'Common Stock' | 'ETF' | 'Fund' | string
  IsDelisted: boolean
  Currency?: string
}

/* ----------------------------------------------------
   7. Search endpoint        (GET /search/{q}) – paid tiers
   -------------------------------------------------- */
export interface SearchResult {
  Code: string
  Exchange: string
  Name: string
  Type: string // "Common Stock", "ETF", …
  Country?: string
}

/* ----------------------------------------------------
   8. Fundamentals (Partial)
   -------------------------------------------------- */
export interface EodFundamentals {
  General: {
    Code: string
    Type: string
    Name: string
    Exchange: string
    CurrencyCode: string
    CurrencySymbol: string
    CountryName: string
    CountryISO: string
    ISIN: string
    CUSIP: string
    CIK: string
    EmployerIdNumber: string
    FiscalYearEnd: string
    IPODate: string
    InternationalDomestic: string
    Sector: string
    Industry: string
    GicSector: string
    GicGroup: string
    GicIndustry: string
    GicSubIndustry: string
    HomeCategory: string
    IsDelisted: boolean
    Description: string
    Address: string
    AddressData: {
      Street: string
      City: string
      State: string
      Country: string
      Zip: string
    }
    Listings: Record<string, any>
    Officers: Record<string, any>
    Phone: string
    WebURL: string
    LogoURL: string
    FullTimeEmployees: string
    UpdatedAt: string
  }
  Highlights: {
    MarketCapitalization: number
    MarketCapitalizationMln: number
    EBITDA: number
    PE: number
    PEG: number
    WallStreetTargetPrice: number
    BookValue: number
    DividendShare: number
    DividendYield: number
    EarningsShare: number
    EPSEstimateCurrentYear: number
    EPSEstimateNextYear: number
    EPSEstimateNextQuarter: number
    EPSEstimateCurrentQuarter: number
    MostRecentQuarter: string
    ProfitMargin: number
    OperatingMarginTTM: number
    ReturnOnAssetsTTM: number
    ReturnOnEquityTTM: number
    RevenueTTM: number
    RevenuePerShareTTM: number
    QuarterlyRevenueGrowthYOY: number
    GrossProfitTTM: number
    DilutedEpsTTM: number
    QuarterlyEarningsGrowthYOY: number
  }
  Valuation: {
    TrailingPE: number
    ForwardPE: number
    PriceSalesTTM: number
    PriceBookMRQ: number
    EnterpriseValue: number
    EnterpriseValueRevenue: number
    EnterpriseValueEbitda: number
  }
  SharesStats: {
    SharesOutstanding: number
    SharesFloat: number
    PercentInsiders: number
    PercentInstitutions: number
    SharesShort: number
    SharesShortPriorMonth: number
    ShortRatio: number
    ShortPercentOutstanding: number
    ShortPercentFloat: number
  }
  Technicals: {
    Beta: number
    '52WeekHigh': number
    '52WeekLow': number
    '50DayMA': number
    '200DayMA': number
    SharesShort: number
    SharesShortPriorMonth: number
    ShortRatio: number
    ShortPercent: number
  }
  SplitsDividends: {
    ForwardAnnualDividendRate: number
    ForwardAnnualDividendYield: number
    PayoutRatio: number
    DividendDate: string
    ExDividendDate: string
  }
  Financials: {
    Balance_Sheet: {
      quarterly: Record<
        string,
        {
          date: string
          filing_date: string
          currency_symbol: string
          totalAssets: string
          totalCurrentAssets: string
          totalLiabilities: string
          totalCurrentLiabilities: string
          netDebt: string
          shortTermDebt: string
          longTermDebt: string
          cash: string
          [key: string]: any
        }
      >
      yearly: Record<
        string,
        {
          date: string
          filing_date: string
          currency_symbol: string
          totalAssets: string
          totalCurrentAssets: string
          totalLiabilities: string
          totalCurrentLiabilities: string
          netDebt: string
          shortTermDebt: string
          longTermDebt: string
          cash: string
          [key: string]: any
        }
      >
    }
    Cash_Flow: {
      quarterly: Record<
        string,
        {
          date: string
          filing_date: string
          currency_symbol: string
          freeCashFlow: string
          capitalExpenditures: string
          salePurchaseOfStock: string
          stockBasedCompensation: string
          [key: string]: any
        }
      >
      yearly: Record<
        string,
        {
          date: string
          filing_date: string
          currency_symbol: string
          freeCashFlow: string
          capitalExpenditures: string
          salePurchaseOfStock: string
          stockBasedCompensation: string
          [key: string]: any
        }
      >
    }
    Income_Statement: {
      quarterly: Record<
        string,
        {
          date: string
          filing_date: string
          currency_symbol: string
          totalRevenue: string
          costOfRevenue: string
          grossProfit: string
          operatingIncome: string
          netIncome: string
          [key: string]: any
        }
      >
      yearly: Record<
        string,
        {
          date: string
          filing_date: string
          currency_symbol: string
          totalRevenue: string
          costOfRevenue: string
          grossProfit: string
          operatingIncome: string
          netIncome: string
          [key: string]: any
        }
      >
    }
  }
}
