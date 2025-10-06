import { onUnmounted } from 'vue'

/**
 * Returns a promise that resolves with { public_token } on success.
 */
export function usePlaidLink(linkToken: string) {
  return new Promise<{
    publicToken: string
    institutionId: string | undefined
  }>((resolve, reject) => {
    const handler = window.Plaid.create({
      token: linkToken,
      container: 'plaid-link-container',
      onSuccess(public_token: string, meta: any) {
        resolve({
          publicToken: public_token,
          institutionId: meta?.institution?.id, // "ins_3"  (present only in connect-mode)
        })
        handler.exit()
      },
      onExit: (_err, _meta) => reject(_err),
    })
    handler.open()

    // cleanup when component unmounts
    onUnmounted(() => handler.exit({ force: true }))
  })
}
