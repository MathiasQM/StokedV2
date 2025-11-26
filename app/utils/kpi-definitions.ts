export interface KPIDefinition {
  description: string
  formula?: string
  interpretation?: string
  analyze?: (value: number) => string
}

export const KPI_DEFINITIONS: Record<string, KPIDefinition> = {
  'P/E': {
    description:
      "The Price-to-Earnings (P/E) ratio measures a company's current share price relative to its per-share earnings.",
    formula: 'Market Price per Share / Earnings per Share (EPS)',
    interpretation:
      "A high P/E ratio could mean that a company's stock is overvalued, or else that investors are expecting high growth rates in the future.",
    analyze: (val) => {
      if (val < 0)
        return 'A negative P/E indicates the company is currently unprofitable.'
      if (val < 15)
        return `At ${val.toFixed(1)}, this P/E is relatively low, potentially indicating the stock is undervalued or the company is facing challenges.`
      if (val < 25)
        return `At ${val.toFixed(1)}, this P/E is around the historical market average, suggesting fair valuation.`
      return `At ${val.toFixed(1)}, this P/E is higher than average, suggesting investors expect high future growth or the stock is overvalued.`
    },
  },
  'Forward P/E': {
    description:
      'The Forward Price-to-Earnings (Forward P/E) ratio is a version of the P/E ratio that uses forecasted earnings for the P/E calculation.',
    formula: 'Current Share Price / Estimated Future EPS',
    interpretation:
      'If the Forward P/E is lower than the current P/E, it implies that analysts expect earnings to increase.',
    analyze: (val) => {
      if (val < 15)
        return `A Forward P/E of ${val.toFixed(1)} suggests analysts expect strong earnings relative to the current price.`
      return `A Forward P/E of ${val.toFixed(1)} indicates expected earnings growth, but the stock may still be priced for perfection.`
    },
  },
  'Price/Sales': {
    description:
      'The Price-to-Sales (P/S) ratio shows how much investors are willing to pay per dollar of sales for a stock.',
    formula: 'Market Capitalization / Total Revenue',
    interpretation:
      'A low P/S ratio can imply the stock is undervalued, while a significantly higher-than-average ratio can suggest the stock is overvalued.',
    analyze: (val) => {
      if (val < 1)
        return `A P/S ratio of ${val.toFixed(1)} is very low, often seen in undervalued stocks or struggling sectors.`
      if (val < 3)
        return `A P/S ratio of ${val.toFixed(1)} is generally considered healthy.`
      return `A P/S ratio of ${val.toFixed(1)} is high, typical for high-growth tech companies but implies higher risk.`
    },
  },
  'Price/Book': {
    description:
      "The Price-to-Book (P/B) ratio compares a company's market value to its book value (net assets).",
    formula: 'Market Price per Share / Book Value per Share',
    interpretation:
      'A P/B ratio of less than 1.0 can indicate that a stock is undervalued.',
    analyze: (val) => {
      if (val < 1)
        return `A P/B of ${val.toFixed(1)} suggests the stock is trading below its book value, potentially undervalued.`
      if (val < 3)
        return `A P/B of ${val.toFixed(1)} is within a standard range for many industries.`
      return `A P/B of ${val.toFixed(1)} indicates a premium over book value, common in asset-light businesses.`
    },
  },
  'EV/EBITDA': {
    description:
      'The Enterprise Value to EBITDA ratio compares the value of a company, inclusive of debt and other liabilities, to the actual cash earnings exclusive of the non-cash expenses.',
    formula: 'Enterprise Value / EBITDA',
    interpretation:
      'A lower EV/EBITDA ratio is generally viewed as a sign that a company is potentially undervalued.',
    analyze: (val) => {
      if (val < 10)
        return `An EV/EBITDA of ${val.toFixed(1)} is generally considered healthy or undervalued.`
      return `An EV/EBITDA of ${val.toFixed(1)} is on the higher side, suggesting growth expectations.`
    },
  },
  PEG: {
    description:
      'The Price/Earnings-to-Growth (PEG) ratio enhances the P/E ratio by adding expected earnings growth into the calculation.',
    formula: 'P/E Ratio / Earnings Growth Rate',
    interpretation:
      'A PEG ratio of 1.0 or lower suggests a stock is fairly priced or undervalued. A PEG ratio above 1.0 suggests a stock is overvalued.',
    analyze: (val) => {
      if (val < 1)
        return `A PEG of ${val.toFixed(2)} suggests the stock may be undervalued relative to its growth.`
      return `A PEG of ${val.toFixed(2)} suggests the stock price is outpacing expected growth.`
    },
  },
  'Free Cash Flow (MRQ)': {
    description:
      'Free Cash Flow (FCF) represents the cash a company generates after accounting for cash outflows to support operations and maintain its capital assets.',
    formula: 'Operating Cash Flow - Capital Expenditures',
    interpretation:
      'Positive FCF indicates a company has cash to pay dividends, buy back stock, or pay down debt.',
    analyze: (val) => {
      if (val > 0)
        return 'Positive Free Cash Flow is a strong sign of financial health and flexibility.'
      return 'Negative Free Cash Flow indicates the company is burning cash, which may be acceptable for high-growth phases but risky long-term.'
    },
  },
  'SBC (MRQ)': {
    description:
      'Stock-Based Compensation (SBC) is a way of paying employees, executives, and directors of a company with equity in the business.',
    formula: 'N/A (Line item from Cash Flow Statement)',
    interpretation:
      'High SBC can dilute existing shareholders. It is often added back to calculate Adjusted EBITDA but is a real cost to shareholders.',
  },
  'Profit Margin': {
    description:
      'Profit Margin is a profitability ratio calculated as net income divided by revenue, or net profit divided by sales.',
    formula: 'Net Income / Revenue',
    interpretation:
      'A higher profit margin indicates a more profitable company that has better control over its costs compared to its competitors.',
    analyze: (val) => {
      if (val < 0)
        return 'Negative profit margin indicates the company is operating at a loss.'
      if (val < 0.1)
        return `A profit margin of ${(val * 100).toFixed(1)}% is relatively thin.`
      if (val < 0.2)
        return `A profit margin of ${(val * 100).toFixed(1)}% is healthy.`
      return `A profit margin of ${(val * 100).toFixed(1)}% is very strong, indicating high efficiency or pricing power.`
    },
  },
  'Operating Margin': {
    description:
      'Operating Margin measures how much profit a company makes on a dollar of sales after paying for variable costs of production, such as wages and raw materials, but before paying interest or tax.',
    formula: 'Operating Income / Revenue',
    interpretation:
      'It gives investors a good idea of how much money a company makes on each dollar of sales.',
  },
  'Rev Growth (YoY)': {
    description:
      "Revenue Growth (Year-over-Year) compares a company's revenue for a recent period to its revenue for the same period in the previous year.",
    formula:
      '(Current Period Revenue - Prior Period Revenue) / Prior Period Revenue',
    interpretation:
      'Positive growth indicates the company is expanding its sales.',
    analyze: (val) => {
      if (val < 0) return 'Negative revenue growth indicates shrinking sales.'
      if (val < 0.1)
        return `Growth of ${(val * 100).toFixed(1)}% is steady but modest.`
      if (val < 0.2) return `Growth of ${(val * 100).toFixed(1)}% is strong.`
      return `Growth of ${(val * 100).toFixed(1)}% is very high, typical of aggressive growth phases.`
    },
  },
  'Earnings Growth (YoY)': {
    description:
      "Earnings Growth (Year-over-Year) compares a company's earnings for a recent period to its earnings for the same period in the previous year.",
    formula:
      '(Current Period Earnings - Prior Period Earnings) / Prior Period Earnings',
    interpretation:
      'Positive growth indicates the company is becoming more profitable.',
  },
  Cash: {
    description:
      "Cash and Cash Equivalents represents the value of a company's assets that are cash or can be converted into cash immediately.",
    formula: 'N/A (Balance Sheet Item)',
    interpretation:
      'High cash balances provide liquidity and safety but may also indicate inefficient capital allocation if not deployed.',
  },
  'Total Debt': {
    description: 'Total Debt is the sum of short-term and long-term debt.',
    formula: 'Short-Term Debt + Long-Term Debt',
    interpretation:
      "High debt levels can be risky, especially if interest rates rise or the company's cash flow declines.",
  },
  'Net Cash': {
    description: "Net Cash is a company's total cash minus its total debt.",
    formula: 'Cash & Equivalents - Total Debt',
    interpretation:
      'Positive net cash means the company has more cash than debt, indicating financial strength.',
    analyze: (val) => {
      if (val > 0)
        return 'Positive Net Cash indicates a fortress balance sheet with more cash than debt.'
      return 'Negative Net Cash means the company has more debt than cash, which increases financial leverage and risk.'
    },
  },
  'Dividend Yield': {
    description:
      'The Dividend Yield is a financial ratio that shows how much a company pays out in dividends each year relative to its stock price.',
    formula: 'Annual Dividend per Share / Price per Share',
    interpretation:
      'A higher yield is attractive to income investors, but an extremely high yield might indicate the dividend is at risk.',
    analyze: (val) => {
      if (val === 0) return 'This company does not pay a dividend.'
      if (val < 0.02)
        return `A yield of ${(val * 100).toFixed(1)}% is modest, typical for growth companies or the broader market.`
      if (val < 0.05)
        return `A yield of ${(val * 100).toFixed(1)}% is attractive for income investors.`
      return `A yield of ${(val * 100).toFixed(1)}% is very high. Verify sustainability as it may indicate risk.`
    },
  },
  'Payout Ratio': {
    description:
      'The Payout Ratio is the proportion of earnings paid out as dividends to shareholders.',
    formula: 'Dividends per Share / Earnings per Share',
    interpretation:
      'A lower payout ratio is generally more sustainable. A ratio over 100% means the company is paying out more than it earns.',
    analyze: (val) => {
      if (val < 0.5)
        return `A payout ratio of ${(val * 100).toFixed(0)}% is very sustainable and leaves room for dividend growth.`
      if (val < 0.8)
        return `A payout ratio of ${(val * 100).toFixed(0)}% is sustainable for mature companies.`
      return `A payout ratio of ${(val * 100).toFixed(0)}% is high, potentially limiting future dividend growth or indicating risk.`
    },
  },
  'Payout Date': {
    description:
      'The date on which a declared dividend is scheduled to be paid to eligible investors.',
    formula: 'N/A',
    interpretation:
      'Investors must own the stock before the ex-dividend date to receive this payment.',
  },
  'Ex-Div Date': {
    description:
      'The Ex-Dividend Date is the date on which the stock starts trading without the value of its next dividend payment.',
    formula: 'N/A',
    interpretation:
      'If you buy the stock on or after this date, you will not receive the upcoming dividend.',
  },
}
