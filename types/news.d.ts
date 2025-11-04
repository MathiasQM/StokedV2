interface Animation {
  animateIn: string
  animateOut: string
}

interface ArticleComponentData {
  componentName: string
  paragraphIndex: number
  placement: 'above' | 'below' | 'inline-left' | 'inline-right'
  animation: Animation
}

type ArticleSentiment = {
  countValid: number
  countTotal: number
  coverage: number
  avg: { polarity: number; neg: number; neu: number; pos: number } // 0..1
  label: 'Bullish' | 'Neutral' | 'Bearish' | string
  score: number
}
interface ArticleData {
  id: string
  created_at: string
  ticker: string
  title: string
  tags: string[]
  sources: string[]
  introduction: string
  body: string[]
  conclusion: string
  components: ArticleComponentData[]
  sentiment: ArticleSentiment
}
