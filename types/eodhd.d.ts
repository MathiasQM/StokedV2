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
