// server/lib/tts/elevenlabs.ts

import { Buffer } from 'node:buffer'

interface TtsOptions {
  apiKey: string
  voiceId: string
  modelId?: string
}

interface TtsResponse {
  audioBase64: string
  words: { text: string; start: number; end: number }[]
}

export async function ttsWithTimestamps(
  ssmlText: string,
  opts: TtsOptions,
): Promise<TtsResponse> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${opts.voiceId}/with-timestamps`

  let responseData: any
  try {
    // Use a standard $fetch. It will automatically parse the JSON response
    // and throw an error for non-2xx status codes.
    responseData = await $fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': opts.apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        text: ssmlText,
        model_id: opts.modelId || 'eleven_multilingual_v2',
      },
    })
  } catch (error: any) {
    // This block will now correctly catch actual API errors.
    console.error('Error fetching from ElevenLabs API:', error.data)
    throw createError({
      statusCode: 502,
      statusMessage: `ElevenLabs API Error: ${error.data?.detail?.message || 'Failed to fetch from ElevenLabs.'}`,
    })
  }

  // --- THE FINAL, CORRECTED LOGIC ---
  const { audio_base64: audioBase64, alignment } = responseData

  if (!audioBase64 || !alignment) {
    console.error('Invalid response structure from ElevenLabs:', responseData)
    throw createError({
      statusCode: 500,
      statusMessage: 'Invalid successful response from ElevenLabs.',
    })
  }

  const normalizedAlignment = alignment.normalized_alignment
  if (!normalizedAlignment || !normalizedAlignment.characters) {
    console.warn('[ttsWithTimestamps] Missing NORMALIZED alignment data.')
    return { audioBase64, words: [] }
  }

  const {
    characters,
    character_start_times_seconds: charStarts,
    character_end_times_seconds: charEnds,
  } = normalizedAlignment

  const words: { text: string; start: number; end: number }[] = []
  let currentWord = ''
  let wordStart = 0

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]
    if (char.match(/[\s.,;!?]/)) {
      if (currentWord.length > 0) {
        words.push({
          text: currentWord,
          start: wordStart,
          end: charEnds[i - 1],
        })
        currentWord = ''
      }
    } else {
      if (currentWord.length === 0) {
        wordStart = charStarts[i]
      }
      currentWord += char
    }
  }
  if (currentWord.length > 0) {
    words.push({
      text: currentWord,
      start: wordStart,
      end: charEnds[characters.length - 1],
    })
  }

  return { audioBase64, words }
}
