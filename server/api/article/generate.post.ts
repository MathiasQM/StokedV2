// server/api/article/generate.post.ts
import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { openaiJson } from '@@/server/lib/llm/openai'
import { ArticleJson, type ArticleJsonT } from '@@/server/lib/schema/article'
import { normalizeProviderNews } from '@@/server/lib/news/normalize'
import { and, desc, eq, gt } from 'drizzle-orm'
import { podcasts } from '@@/server/database/schema/podcasts'

const In = z.object({
  ticker: z.string(),
  articles: z.any().optional(),
  providerNews: z.any().optional(),
  max: z.number().optional(),
})

const SCRIPT_SYSTEM_PROMPT = `You are an expert financial podcast scriptwriter. Your goal is to write a 4–5 minute market news podcast script optimized for ElevenLabs v3 voice generation, based on the provided articles. The script must be actionable and insightful for retail and professional investors.`

const ALLOWED_COMPONENTS = ['LogoChip', 'PriceChart', 'KPIList', 'ImagePanel']

const SCRIPT_INSTRUCTIONS = `
TONE & STYLE:
- Relatable, conversational, but data-driven.
- Speak directly to the listener as an investor.
- Balanced: highlight both upside potential and risks.
- Anchor to fundamentals like earnings, sales, margins, etc.

STRUCTURE (follow this order precisely):
1. [voice:Host][narration][music:intro 5s fade] COLD OPEN (60–90 words)
2. [voice:Host][conversational] SETUP (80–120 words)
3. [voice:Analyst][thoughtful] KEY DATA & EVENTS (140–180 words)
4. [voice:Host][conversational] MARKET REACTION VS FUNDAMENTALS (120–160 words)
5. [voice:Analyst][thoughtful] HISTORICAL & PEER CONTEXT (120–160 words)
6. [voice:Host][narration] RISKS & WHAT TO WATCH (100–140 words)
7. [voice:Host][emphasis] INVESTOR TAKEAWAYS (90–120 words)
8. [voice:Host][narration][music:transition 2s] SECONDARY STORIES (if applicable)
9. [voice:Host][conversational] FORWARD LOOK (70–110 words)
10. [voice:Host][narration][music:outro 5s fade] OUTRO (40–70 words)

DELIVERY CUES:
- Use ElevenLabs v3 tags inline: [voice:Host], [voice:Analyst], [narration], [conversational], [thoughtful], [pause 0.5s], [breath], [emphasis].

FINAL CHECKS:
- Final script length must be 750–900 words.
- Always tie news back to the investor perspective.
- Replace ticker abbreviations with full company names.
`

async function generateScript(
  apiKey: string,
  ticker: string,
  articles: any[],
): Promise<any> {
  const userMsg = {
    role: 'user',
    content: `
      INPUT TICKER: ${ticker}
      INPUT ARTICLES: ${JSON.stringify(articles, null, 2)}
      ---
      INSTRUCTIONS:
      ${SCRIPT_INSTRUCTIONS}
      ---
      Return ONLY a JSON object with 'title' and 'script' keys.
      The script object must contain 'words' and 'sections' properties.
      The script sections must follow the 10-part structure provided in the instructions.
      Example Format: {
        "words": <int>,
        "sections": [
        { "id":"cold_open","voice":"Host","style":["narration"],"text":"...", "sentences":[
            {"id":"cold_open.s1","text":"...","tokens":[{"id":"cold_open.s1.t1","text":"Apple"},...]}
        ]}, ...
        ]
    },
    `,
  }
  return await openaiJson(apiKey, [
    { role: 'system', content: SCRIPT_SYSTEM_PROMPT },
    userMsg,
  ])
}

// --- CALL 2: GENERATE ARTICLE FROM SCRIPT ---
async function generateArticleFromScript(
  apiKey: string,
  scriptSections: any[],
): Promise<any> {
  const system = `You are a skilled content editor. Your task is to convert a podcast script into a well-structured, readable HTML article.`
  const scriptTextWithIds = scriptSections
    .map((s) => `ID: ${s.id}\nTEXT: ${s.text}`)
    .join('\n---\n')

  const userMsg = {
    role: 'user',
    content: `
      Please convert the following podcast script into an engaging HTML article. Use <p>, <h2>, and <ul> tags to format the content for readability. Combine related points into logical paragraphs. Do not change the facts or meaning.
      CRITICAL: You MUST use the original ID for each corresponding section in your output.

    SCRIPT WITH IDs:
      ---
      ${scriptTextWithIds}
      ---

      Return ONLY a JSON object with a single 'sections' key.
      Example Format: { "sections": [ { "id": "key_data_events", "html": "<h2>...</h2><p>...</p>" }, ... ] }
    `,
  }
  return await openaiJson(apiKey, [
    { role: 'system', content: system },
    userMsg,
  ])
}

async function generateComponentsFromScript(
  apiKey: string,
  scriptText: string,
  ticker: string,
  validIds: string[],
  allowedComponents: string[],
): Promise<any> {
  const system = `You are a data extraction AI. Your job is to analyze text and identify opportunities for relevant visual aids for a financial news article.`
  const userMsg = {
    role: 'user',
    content: `
      Analyze the following podcast script for ticker ${ticker}.
      Identify key data points, companies, and concepts.
      Generate a JSON object containing 'render_cues' and 'article_components' to visually enhance the content.

      CRITICAL: For the 'type' of each component, you MUST choose from the following allowed list:
      [${allowedComponents.map((c) => `'${c}'`).join(', ')}]
      
      CRITICAL: You MUST only use section IDs from the following valid list: [${validIds.map((id) => `'${id}'`).join(', ')}]

      - Generate at least 3 'render_cue' targeting a valid section ID.
      - Generate at least two 'article_components' targeting valid section IDs.

      SCRIPT:
      ---
      ${scriptText}
      ---
      
      Return ONLY a JSON object with 'render_cues' and 'article_components' keys.
      Example Format:       {
        "render_cues": [
          { "trigger": { "type":"section", "id":"setup", "at":"start" }, "components":[ { "type":"LogoChip", "params":{ "ticker":"${ticker}" } } ] }
        ],
        "article_components": [
          { "where": { "sectionId": "key_data" }, "component": { "type":"PriceChart", "params":{ "ticker":"${ticker}", "range":"1D" } } }
        ]
      }
    `,
  }
  return await openaiJson(apiKey, [
    { role: 'system', content: system },
    userMsg,
  ])
}

// --- helpers ---
const stripFences = (s: string) =>
  s
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/i, '')
    .trim()

const tokenize = (sectionId: string, text: string) => {
  // naive sentence split
  const sentences = (text.match(/[^.!?]+[.!?]*/g) || [text])
    .map((t) => t.trim())
    .filter(Boolean)
  return sentences.map((sent, i) => {
    const sid = `${sectionId}.s${i + 1}`
    const words = sent.match(/\S+/g) || []
    const tokens = words.map((w, j) => ({ id: `${sid}.t${j + 1}`, text: w }))
    return { id: sid, text: sent, tokens }
  })
}

function coerceArticleJson(raw: any, ticker: string): ArticleJsonT {
  const out: any = { ...raw }

  // 1. Ensure basic fields are present.
  out.ticker ||= ticker
  out.title ||= raw.title || `Daily brief for ${ticker}`
  out.script ||= { sections: [] }
  out.render_cues ||= []
  out.article_components ||= []

  // 2. Repair the script (our source of truth).
  // This fixes malformed sections from the LLM, like a missing 'text' property.
  if (out.script.sections) {
    out.script.sections = out.script.sections.map((sec: any) => {
      if (
        !sec.text &&
        Array.isArray(sec.sentences) &&
        sec.sentences.length > 0
      ) {
        console.warn(`[coerce] Rebuilding missing text for section: ${sec.id}`)
        sec.text = sec.sentences.map((s: any) => s.text || '').join(' ')
      }
      return sec
    })
  }

  // 3. Unconditionally re-tokenize the script.
  // This guarantees a perfect structure for the downstream timestamp alignment engine.
  if (out.script.sections) {
    out.script.sections = out.script.sections.map((sec: any) => {
      const text = sec.text || ''
      const sentences = tokenize(sec.id, text).map((s) => ({
        ...s,
        tokens: s.tokens.filter((t) => t.text),
      }))

      return {
        id: sec.id,
        voice: sec.voice || 'Host',
        style: Array.isArray(sec.style) ? sec.style : ['narration'],
        text,
        sentences,
      }
    })
  }

  // 4. Force article sections to be built FROM the repaired script.
  // This guarantees the section IDs always match for rendering inline components.
  if (out.script.sections?.length) {
    out.sections = out.script.sections.map((scriptSec: any) => {
      const cleanText = (scriptSec.text || '').replace(/\[[^\]]+\]/g, '').trim()
      return {
        id: scriptSec.id,
        html: `<p>${cleanText.replace(/\n/g, '</p><p>')}</p>`,
      }
    })
  }

  // 5. Final cleanup of components.
  out.article_components = (
    Array.isArray(out.article_components) ? out.article_components : []
  )
    .filter(
      (c: any) =>
        c && c.where && typeof c.where.sectionId === 'string' && c.component,
    )
    .map((c: any) => ({
      where: { sectionId: c.where.sectionId },
      component: {
        type: c.component.type,
        params: c.component.params || {},
      },
    }))

  return out as ArticleJsonT
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  if (!cfg.openaiApiKey)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing OPENAI_API_KEY',
    })

  const body = await readBody(event)
  const { ticker, articles, providerNews, max } = In.parse(body)

  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
  const [cachedPodcast] = await useDB()
    .select()
    .from(podcasts)
    .where(
      and(
        eq(podcasts.ticker, ticker),
        eq(podcasts.status, 'completed'),
        gt(podcasts.createdAt, twelveHoursAgo),
      ),
    )
    .orderBy(desc(podcasts.createdAt))
    .limit(1)

  if (cachedPodcast) {
    console.log(`[Cache Hit] Serving fresh podcast for ${ticker} from DB.`)
    return cachedPodcast.articleJson as ArticleJsonT
  }

  console.log(`[Cache Miss] Generating new podcast for ${ticker}`)

  // 1) Normalize news
  const ARTICLES = Array.isArray(articles)
    ? articles
    : normalizeProviderNews(providerNews || [], { ticker, max: max ?? 12 })

  if (!ARTICLES.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No articles after normalization',
    })
  }

  const scriptResult = await generateScript(cfg.openaiApiKey, ticker, ARTICLES)
  if (!scriptResult?.script?.sections) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate script.',
    })
  }

  const scriptSections = scriptResult.script.sections
  const scriptText = scriptSections.map((s: any) => s.text).join('\n')
  const sectionIds = scriptSections.map((s: any) => s.id)

  // 2. Generate the other parts in parallel
  const [articleResult, componentsResult] = await Promise.all([
    generateArticleFromScript(cfg.openaiApiKey, scriptSections),
    generateComponentsFromScript(
      cfg.openaiApiKey,
      scriptText,
      ticker,
      sectionIds,
      ALLOWED_COMPONENTS,
    ),
  ])

  // 3. Assemble the final JSON object
  const finalJson = {
    ticker,
    title: scriptResult.title,
    script: scriptResult.script,
    sections: articleResult?.sections || [],
    render_cues: componentsResult?.render_cues || [],
    article_components: componentsResult?.article_components || [],
  }

  // 4. Coerce and validate the final, assembled object
  const coerced = coerceArticleJson(finalJson, ticker)
  const parsed = ArticleJson.safeParse(coerced)

  if (!parsed.success) {
    console.error(
      '[article.generate] Schema validation failed:',
      parsed.error.flatten(),
    )
    return coerced
  }

  const newPodcastData = parsed.data

  // --- STEP 3: SAVE THE NEW PODCAST TO CACHE ---
  await useDB().insert(podcasts).values({
    ticker: ticker,
    title: newPodcastData.title,
    status: 'completed',
    articleJson: newPodcastData,
  })

  return parsed.data
})
