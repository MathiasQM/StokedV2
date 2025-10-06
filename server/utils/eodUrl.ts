import { useRuntimeConfig } from '#imports'

export function eodUrl(path: string, search: Record<string, any> = {}) {
  const {
    public: { eodBase },
    eodApiKey,
  } = useRuntimeConfig()

  // always attach token + json output
  const params = new URLSearchParams({
    api_token: eodApiKey,
    fmt: 'json',
    ...Object.fromEntries(
      Object.entries(search).filter(([, v]) => v !== undefined && v !== null),
    ),
  })

  return `${eodBase.replace(/\/$/, '')}/${path.replace(/^\//, '')}?${params}`
}
