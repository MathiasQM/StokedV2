import type { EodFundamentals } from '../../../types/eodhd'

export interface KPIItem {
  label: string
  value: number | string
  formattedValue: string
  definitionKey: string
  history?: { date: string; value: number }[]
  isPercent?: boolean
}

export interface KPISection {
  title: string
  items: KPIItem[]
}

export function useStockFinancials(
  data: MaybeRef<EodFundamentals | undefined>,
) {
  const formatCurrency = (value: number | string, currency = 'USD') => {
    if (!value) return '-'
    const num =
      typeof value === 'string' ? parseFloat(value) : (value as number)
    if (isNaN(num)) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatNumber = (value: number | string, suffix = '') => {
    if (!value) return '-'
    const num =
      typeof value === 'string' ? parseFloat(value) : (value as number)
    if (isNaN(num)) return '-'
    return (
      new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(num) + suffix
    )
  }

  const formatPercent = (value: number | string) => {
    if (!value) return '-'
    const num =
      typeof value === 'string' ? parseFloat(value) : (value as number)
    if (isNaN(num)) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 2,
    }).format(num)
  }

  const formatDate = (dateString: string | number) => {
    if (!dateString) return '-'
    return new Date(dateString.toString()).toLocaleDateString()
  }

  const getHistory = (
    financials: any,
    key: string,
    transform: (val: any, quarterData?: any) => number = parseFloat,
  ) => {
    if (!financials) return undefined
    // Prefer quarterly for history to allow granular filtering in UI
    const data = financials.quarterly || financials.yearly || financials
    const periods = Object.values(data).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    // Return last 5 years (approx 20 quarters)
    return periods.slice(-20).map((q: any) => ({
      date: q.date,
      value: transform(q[key], q),
    }))
  }

  const sections = computed<KPISection[]>(() => {
    const d = unref(data)
    if (!d) return []

    const valuation = d.Valuation
    const highlights = d.Highlights
    const currency = d.General?.CurrencyCode || 'USD'

    // Helper to get history from financials
    const incomeStatement = d.Financials?.Income_Statement
    const balanceSheet = d.Financials?.Balance_Sheet
    const cashFlow = d.Financials?.Cash_Flow

    const out: KPISection[] = []

    // Valuation
    if (valuation || highlights) {
      const items = [
        {
          label: 'P/E',
          value: valuation?.TrailingPE || highlights?.PE,
          format: formatNumber,
        },
        {
          label: 'Forward P/E',
          value: valuation?.ForwardPE,
          format: formatNumber,
        },
        {
          label: 'Price/Sales',
          value: valuation?.PriceSalesTTM,
          format: formatNumber,
        },
        {
          label: 'Price/Book',
          value: valuation?.PriceBookMRQ || highlights?.BookValue,
          format: formatNumber,
        },
        {
          label: 'EV/EBITDA',
          value: valuation?.EnterpriseValueEbitda,
          format: formatNumber,
        },
        { label: 'PEG', value: highlights?.PEG, format: formatNumber },
      ]
        .filter((i) => i.value != null)
        .map((i) => ({
          label: i.label,
          value: i.value,
          formattedValue: i.format(i.value),
          definitionKey: i.label,
          // P/E history is hard to derive from just financials without price history
          history: undefined,
          isPercent: false,
        }))

      if (items.length) out.push({ title: 'Valuation', items })
    }

    // Margins & Growth
    if (highlights) {
      const items = [
        {
          label: 'Profit Margin',
          value: highlights.ProfitMargin,
          format: formatPercent,
          history: getHistory(
            incomeStatement,
            'netIncome',
            (v, q) => parseFloat(v) / parseFloat(q.totalRevenue),
          ), // Approximation if we compare with revenue
        },
        {
          label: 'Operating Margin',
          value: highlights.OperatingMarginTTM,
          format: formatPercent,
          history: getHistory(
            incomeStatement,
            'operatingIncome',
            (v, q) => parseFloat(v) / parseFloat(q.totalRevenue),
          ),
        },
        {
          label: 'Rev Growth (YoY)',
          value: highlights.QuarterlyRevenueGrowthYOY,
          format: formatPercent,
          history: getHistory(incomeStatement, 'totalRevenue'),
        },
        {
          label: 'Earnings Growth (YoY)',
          value: highlights.QuarterlyEarningsGrowthYOY,
          format: formatPercent,
          history: getHistory(incomeStatement, 'netIncome'),
        },
      ]
        .filter((i) => i.value != null)
        .map((i) => ({
          label: i.label,
          value: i.value,
          formattedValue: i.format(i.value),
          definitionKey: i.label,
          history: i.history,
          // For growth metrics, we show history of absolute values (Revenue/Income), so don't format chart as percent
          isPercent:
            i.format === formatPercent &&
            !['Rev Growth (YoY)', 'Earnings Growth (YoY)'].includes(i.label),
        }))

      if (items.length) out.push({ title: 'Margins & Growth', items })
    }

    // Balance Sheet
    const bsQuarters = balanceSheet?.quarterly
    if (bsQuarters) {
      const quarters = Object.values(bsQuarters).sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      const mrq = quarters[0] as any
      if (mrq) {
        const cash = parseFloat(mrq.cash)
        const debt =
          parseFloat(mrq.shortTermDebt) + parseFloat(mrq.longTermDebt)
        const net = cash - debt

        const items = [
          {
            label: 'Cash',
            value: cash,
            format: (v: number) => formatCurrency(v, currency),
            history: getHistory(balanceSheet, 'cash'),
          },
          {
            label: 'Total Debt',
            value: debt,
            format: (v: number) => formatCurrency(v, currency),
            history: getHistory(
              balanceSheet,
              'shortTermDebt',
              (v, q) => parseFloat(v) + parseFloat(q.longTermDebt),
            ), // Approximation, need row-wise sum
          },
          {
            label: 'Net Cash',
            value: net,
            format: (v: number) => formatCurrency(v, currency),
            // Net cash history requires calculation per quarter
            history: getHistory(
              balanceSheet,
              'cash',
              (v, q) =>
                parseFloat(v) -
                (parseFloat(q.shortTermDebt) + parseFloat(q.longTermDebt)),
            ),
          },
        ].map((i) => ({
          label: i.label,
          value: i.value,
          formattedValue: i.format(i.value),
          definitionKey: i.label,
          history: i.history,
          isPercent: false,
        }))

        out.push({ title: 'Balance Sheet (MRQ)', items })
      }
    }

    // Cash Flow
    const cfQuarters = cashFlow?.quarterly
    if (cfQuarters) {
      const quarters = Object.values(cfQuarters).sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      const mrq = quarters[0] as any
      if (mrq) {
        const fcf = parseFloat(mrq.freeCashFlow)
        const sbc = parseFloat(mrq.stockBasedCompensation)

        const items = [
          {
            label: 'Free Cash Flow (MRQ)',
            value: fcf,
            format: (v: number) => formatCurrency(v, currency),
            history: getHistory(cashFlow, 'freeCashFlow'),
          },
          {
            label: 'SBC (MRQ)',
            value: sbc,
            format: (v: number) => formatCurrency(v, currency),
            history: getHistory(cashFlow, 'stockBasedCompensation'),
          },
        ].map((i) => ({
          label: i.label,
          value: i.value,
          formattedValue: i.format(i.value),
          definitionKey: i.label,
          history: i.history,
          isPercent: false,
        }))

        out.push({ title: 'Cash Flow (MRQ)', items })
      }
    }

    // Dividends
    const div = d.SplitsDividends
    if (highlights || div) {
      const items = [
        {
          label: 'Dividend Yield',
          value: highlights?.DividendYield || div?.ForwardAnnualDividendYield,
          format: formatPercent,
        },
        {
          label: 'Payout Ratio',
          value: div?.PayoutRatio,
          format: formatPercent,
        },
        { label: 'Payout Date', value: div?.DividendDate, format: formatDate },
        {
          label: 'Ex-Div Date',
          value: div?.ExDividendDate,
          format: formatDate,
        },
      ]
        .filter((i) => {
          if (i.value == null) return false
          if (i.label === 'Dividend Yield' && Number(i.value) === 0)
            return false
          if (i.label === 'Payout Ratio' && Number(i.value) === 0) return false
          return true
        })
        .map((i) => ({
          label: i.label,
          value: i.value,
          formattedValue: i.format(i.value),
          definitionKey: i.label,
          history: undefined,
          isPercent: i.format === formatPercent,
        }))

      if (items.length) out.push({ title: 'Dividends', items })
    }

    return out
  })

  return { sections }
}
