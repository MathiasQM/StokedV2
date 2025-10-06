export async function openaiJson<T>(
  apiKey: string,
  messages: any[],
  response_format?: any,
): Promise<T> {
  const r = await $fetch<any>('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      response_format: response_format ?? { type: 'json_object' },
    },
  })
  const content = r.choices?.[0]?.message?.content
  try {
    return JSON.parse(content)
  } catch (error) {
    console.log(error)
    // let caller try coercion
    // content might have fences or trailing commentary
    // return as-is so the route can strip & coerce
    return content
  }
}
