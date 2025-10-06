// server/api/podcast/generate.post.ts
import { defineEventHandler, readBody } from 'h3'
import { ttsWithTimestamps } from '@@/server/lib/tts/elevenlabs'
import {
  buildAlignmentIndex,
  materializeCues,
} from '@@/server/lib/sync/alignment'
import { heuristicIndex } from '@@/server/lib/sync/heuristic'

// --- helpers to normalize incoming shapes into { script.sections[], render_cues[] } ---
function toTokens(sectionId: string, sentenceId: string, text: string) {
  const words = (text || '').match(/\S+/g) || []
  return words.map((w, i) => ({
    id: `${sectionId}.${sentenceId}.t${i + 1}`,
    text: w,
  }))
}

function normalizeToScript(articleJsonOrAnything: any) {
  // Case A: ideal shape already
  if (articleJsonOrAnything?.script?.sections?.length) {
    return {
      script: articleJsonOrAnything.script,
      render_cues: articleJsonOrAnything.render_cues || [],
    }
  }

  // Case B: sections with html/text
  if (Array.isArray(articleJsonOrAnything?.sections)) {
    const secs = articleJsonOrAnything.sections.map((s: any, idx: number) => {
      const id = s.id || `sec${idx + 1}`
      const text =
        s.text ||
        (s.html || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      const sid = `${id}.s1`
      return {
        id,
        voice: 'Host',
        style: ['narration'],
        text,
        sentences: [{ id: sid, text, tokens: toTokens(id, 's1', text) }],
      }
    })
    const words = secs.map((s: any) => s.text).join(' ').length
    return {
      script: { words, sections: secs },
      render_cues: articleJsonOrAnything.render_cues || [],
    }
  }

  // Case C: paragraphs: string[]
  if (Array.isArray(articleJsonOrAnything?.paragraphs)) {
    const secs = articleJsonOrAnything.paragraphs.map(
      (p: string, idx: number) => {
        const id = `sec${idx + 1}`
        const sid = `${id}.s1`
        return {
          id,
          voice: idx ? 'Analyst' : 'Host',
          style: idx ? ['thoughtful'] : ['narration'],
          text: p,
          sentences: [{ id: sid, text: p, tokens: toTokens(id, 's1', p) }],
        }
      },
    )
    const words = secs.map((s: any) => s.text).join(' ').length
    return { script: { words, sections: secs }, render_cues: [] }
  }

  // Case D: single text
  if (typeof articleJsonOrAnything?.text === 'string') {
    const p = articleJsonOrAnything.text
    const id = 'sec1'
    const sid = `${id}.s1`
    return {
      script: {
        words: p.length,
        sections: [
          {
            id,
            voice: 'Host',
            style: ['narration'],
            text: p,
            sentences: [{ id: sid, text: p, tokens: toTokens(id, 's1', p) }],
          },
        ],
      },
      render_cues: articleJsonOrAnything.render_cues || [],
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Missing script sections',
  })
}

function convertToSsml(text: string): string {
  let ssmlText = text

  // 1. Escape special XML characters to prevent conflicts.
  ssmlText = ssmlText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  // 2. Convert custom pause tags like [pause 0.5s] to SSML <break> tags.
  ssmlText = ssmlText.replace(/\[pause (\d+\.?\d*)s\]/g, `<break time="$1s"/>`)

  // 3. Convert non-speech sounds like [exhales] or [laughs lightly].
  // Check ElevenLabs docs for the exact supported names for your model.
  ssmlText = ssmlText.replace(
    /\[(exhales|sighs|laughs lightly|clears throat|breath)\]/g,
    (match, sound) => {
      const soundName = sound.replace(/\s+/g, '-') // e.g., "laughs lightly" -> "laughs-lightly"
      return `<vocal-sound name="${soundName}"></vocal-sound>`
    },
  )

  // 4. Convert emphasis tags [emphasis]word[/emphasis] to <emphasis>word</emphasis>
  ssmlText = ssmlText.replace(
    /\[emphasis\](.*?)\[\/emphasis\]/g,
    `<emphasis level="strong">$1</emphasis>`,
  )

  // 5. Remove any other bracketed tags that are not for SSML (like voice or music cues)
  // This prevents them from being read aloud.
  ssmlText = ssmlText.replace(
    /\[(voice|music|narration|conversational|thoughtful)[^\]]*\]/g,
    '',
  )

  // 6. Finally, wrap the entire text in the required <speak> tags.
  return `<speak>${ssmlText.trim()}</speak>`
}
export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const body = await readBody<any>(event)

  const { script, render_cues } = normalizeToScript(body.articleJson ?? body)
  const plainText: string = script.sections.map((s: any) => s.text).join('\n\n')
  const ssmlText = convertToSsml(plainText)

  // 2. Generate the audio using the SSML text.
  const res = await ttsWithTimestamps(ssmlText, {
    apiKey: cfg.elevenLabsApiKey!,
    voiceId: cfg.elevenLabsVoiceId!,
    modelId: cfg.elevenLabsModelId,
  })
  const { audioBase64, words } = res

  // 3. Create a "clean" script for alignment by removing the same tags.
  const cleanScript = {
    ...script,
    sections: script.sections.map((sec: any) => ({
      ...sec,
      text: (sec.text || '')
        .replace(
          /\[(voice|music|narration|conversational|thoughtful)[^\]]*\]/g,
          '',
        )
        .trim(),
      // Also clean the text within sentences for accurate token alignment
      sentences: (sec.sentences || []).map((sent: any) => ({
        ...sent,
        text: (sent.text || '')
          .replace(
            /\[(voice|music|narration|conversational|thoughtful)[^\]]*\]/g,
            '',
          )
          .trim(),
      })),
    })),
  }

  // 4. Use the CLEAN script for alignment and cue generation.
  const valid_render_cues = render_cues.filter(
    (c: any) => c && c.trigger && c.components,
  )

  const idx = words.length
    ? buildAlignmentIndex(
        { script: cleanScript, render_cues: valid_render_cues },
        words,
      )
    : heuristicIndex(
        { script: cleanScript, render_cues: valid_render_cues },
        60,
      )

  const cues = materializeCues(
    { script: cleanScript, render_cues: valid_render_cues } as any,
    idx,
  )

  return {
    audioBase64,
    cues,
    alignmentSample: words.slice(0, 10),
  }
})
