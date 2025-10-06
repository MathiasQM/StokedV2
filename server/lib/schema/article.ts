import { z } from 'zod'

export const Token = z.object({ id: z.string(), text: z.string() })
export const Sentence = z.object({
  id: z.string(),
  text: z.string(),
  tokens: z.array(Token).default([]),
})
export const Section = z.object({
  id: z.string(),
  voice: z.string().default('Host'),
  style: z.array(z.string()).default([]),
  text: z.string().default(''),
  html: z.string().optional(),
  sentences: z.array(Sentence).default([]),
})
export const Script = z.object({
  words: z.number().default(0),
  sections: z.array(Section),
})

export const RenderCue = z.object({
  trigger: z.object({
    type: z.enum(['section', 'sentence', 'word', 'match']),
    id: z.string().optional(),
    at: z.enum(['start', 'end']).optional(),
    query: z.string().optional(),
    occurrence: z.number().optional(),
    scope: z.string().optional(),
  }),
  components: z.array(
    z.object({
      type: z.string(),
      params: z.record(z.any()).default({}),
    }),
  ),
})

export const ArticleJson = z.object({
  ticker: z.string(),
  date: z.string().optional(),
  title: z.string().optional(),
  sections: z
    .array(
      z.object({
        id: z.string(),
        html: z.string().optional(),
        text: z.string().optional(),
      }),
    )
    .default([]),
  script: Script,
  render_cues: z.array(RenderCue).default([]),
  article_components: z
    .array(
      z.object({
        // non-timed visuals to render inline with the article body
        where: z.object({ sectionId: z.string() }),
        component: z.object({ type: z.string(), params: z.record(z.any()) }),
      }),
    )
    .default([]),
})

export type ArticleJsonT = z.infer<typeof ArticleJson>
