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
interface ArticleData {
  id: string
  created_at: string
  ticker: string
  title: string
  introduction: string
  body: string[]
  conclusion: string
  components: ArticleComponentData[]
}
