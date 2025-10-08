import { FetchError } from 'ofetch'

export const usePasskeys = () => {
  const toast = useToast()
  const creating = ref(false)
  const deleting = ref<string | null>(null)

  // --- This is for LINKING a key to an EXISTING, logged-in user ---
  const webAuthnLink = useWebAuthn({
    registerEndpoint: '/api/auth/webauthn/link-passkey',
  })

  // --- This is for REGISTERING a NEW user ---
  const webAuthnRegister = useWebAuthn({
    registerEndpoint: '/api/auth/webauthn/register',
  })

  // --- These are for AUTHENTICATION (signing in) ---
  const webAuthnAuthenticate = useWebAuthn({
    authenticateEndpoint: '/api/auth/webauthn/authenticate',
  })
  const webAuthnAutofill = useWebAuthn({
    authenticateEndpoint: '/api/auth/webauthn/authenticate',
    useBrowserAutofill: true,
  })

  const {
    data: passkeys,
    status,
    refresh,
  } = useFetch('/api/auth/webauthn/linked-passkeys', {
    server: false,
    lazy: true,
  })

  const createPasskey = async (userName: string, displayName: string) => {
    console.log('Adding a passkey to user:', {
      userName: userName,
      displayName: displayName,
    })
    try {
      creating.value = true
      console.log(userName, displayName)
      await webAuthnLink.register({ userName, displayName })
      await refresh()
      toast.add({
        title: 'Passkey added successfully',
        color: 'success',
      })
      return true
    } catch (error) {
      toast.add({
        title: 'Failed to add passkey',
        description: error instanceof FetchError ? error.data?.message : null,
        color: 'error',
      })
      return false
    } finally {
      creating.value = false
    }
  }

  const registerWithPasskey = async (email: string) => {
    try {
      console.log('Registering with passkey for email:', {
        userName: email,
        displayName: email,
      })
      await webAuthnRegister.register({
        userName: email,
        displayName: email,
      })
      return true
    } catch (error) {
      toast.add({
        title: 'Registration Failed',
        description:
          error instanceof FetchError
            ? error.data?.message
            : 'An unknown error occurred.',
        color: 'error',
      })
      return false // Failure
    }
  }

  const revokePasskey = async (id: string) => {
    try {
      deleting.value = id
      await $fetch('/api/auth/webauthn/revoke-passkey', {
        method: 'POST',
        body: { id },
      })
      await refresh()
      toast.add({
        title: 'Passkey revoked successfully',
        color: 'success',
      })
      return true
    } catch (error: any) {
      toast.add({
        title: 'Failed to revoke passkey',
        description: error instanceof FetchError ? error.data?.message : null,
        color: 'error',
      })
      return false
    } finally {
      deleting.value = null
    }
  }

  const invokePasskey = async (id: string) => {
    try {
      deleting.value = id
      await $fetch('/api/auth/webauthn/invoke-passkey', {
        method: 'POST',
        body: { id },
      })
      await refresh()
      toast.add({
        title: 'Passkey invoked successfully',
        color: 'success',
      })
      return true
    } catch (error: any) {
      toast.add({
        title: 'Failed to invoke passkey',
        description: error.data?.statusMessage || 'Failed to invoke passkey',
        color: 'error',
      })
      return false
    } finally {
      deleting.value = null
    }
  }

  const authenticateWithPasskey = async (email?: string) => {
    try {
      await webAuthnAuthenticate.authenticate(email)
      return true
    } catch (error) {
      toast.add({
        title: 'Failed to authenticate with passkey',
        description: error instanceof FetchError ? error.data?.message : null,
        color: 'error',
      })
      return false
    }
  }

  return {
    passkeys,
    status,
    creating,
    deleting,
    registerWithPasskey,
    createPasskey,
    revokePasskey,
    invokePasskey,
    authenticateWithPasskey,
  }
}
