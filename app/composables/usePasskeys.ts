import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { FetchError } from 'ofetch'

class PasskeyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PasskeyError'
  }
}

export const usePasskeys = () => {
  const toast = useToast()
  const creating = ref(false)
  const deleting = ref<string | null>(null)
  const authenticating = ref(false)
  const registering = ref(false)

  const {
    data: passkeys,
    status,
    refresh,
  } = useFetch('/api/auth/webauthn/link/linked', {
    server: false,
    lazy: true,
  })

  const signInWithPasskey = async (isConditional = false) => {
    authenticating.value = true
    try {
      const options = await $fetch(
        '/api/auth/webauthn/authenticate/generate-options',
        { method: 'POST' },
      )

      if (isConditional) {
        options.mediation = 'conditional'
      }

      const assertion = await startAuthentication(options)

      await $fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        body: assertion,
      })

      return true
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.add({
          title: 'Login Cancelled',
          description:
            "You cancelled the passkey sign-in. Try again when you're ready.",
          color: 'info',
        })
      } else if (error instanceof FetchError) {
        toast.add({
          title: 'Sign-In Failed',
          description:
            error.data?.message || 'An unexpected server error occurred.',
          color: 'error',
        })
      } else {
        toast.add({
          title: 'An Error Occurred',
          description: 'Could not sign in with passkey. Please try again.',
          color: 'error',
        })
      }
      return false
    } finally {
      authenticating.value = false
    }
  }

  const createPasskey = async (userName: string, displayName: string) => {
    creating.value = true
    try {
      const options = await $fetch('/api/auth/webauthn/link/generate-options', {
        method: 'POST',
        body: { userName, displayName },
      })

      const attestation = await startRegistration(options)

      await $fetch('/api/auth/webauthn/link/verify', {
        method: 'POST',
        body: attestation,
      })

      await refresh()
      toast.add({
        title: `Successfully added "${displayName}".`,
        color: 'success',
        icon: 'i-lucide-check-circle',
      })
      return true
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.add({
          title: 'Cancelled',
          description: 'You cancelled adding a new passkey.',
          color: 'info',
        })
      } else if (error instanceof FetchError) {
        toast.add({
          title: 'Failed to Add Passkey',
          description: error.data?.message,
          color: 'error',
        })
      } else {
        toast.add({
          title: 'An Error Occurred',
          description: 'Could not add the new passkey.',
          color: 'error',
        })
      }
      return false
    } finally {
      creating.value = false
    }
  }

  const registerWithPasskey = async (email: string) => {
    registering.value = true
    try {
      const options = await $fetch(
        '/api/auth/webauthn/register/generate-options',
        {
          method: 'POST',
          body: { email },
        },
      )

      const attestation = await startRegistration(options)

      await $fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        body: { attestation, email },
      })

      return true
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.add({
          title: 'Registration Cancelled',
          description: 'You cancelled the passkey creation process.',
          color: 'info',
        })
      } else if (error instanceof FetchError) {
        if (error.statusCode === 409) {
          toast.add({
            title: 'Email Already Registered',
            description:
              'An account with this email already exists. Please sign in instead.',
            color: 'orange',
            icon: 'i-lucide-alert-triangle',
          })
        } else {
          toast.add({
            title: 'Registration Failed',
            description:
              error.data?.message || 'An unexpected server error occurred.',
            color: 'error',
          })
        }
      } else {
        toast.add({
          title: 'An Error Occurred',
          description: 'Could not create a passkey. Please try again.',
          color: 'error',
        })
      }
      return false
    } finally {
      registering.value = false
    }
  }

  const revokePasskey = async (id: string) => {
    deleting.value = id

    try {
      await $fetch('/api/auth/webauthn/link/revoke', {
        method: 'POST',
        body: { id },
      })
      await refresh()
      toast.add({
        title: 'Passkey Revoked',
        color: 'success',
        icon: 'i-lucide-check-circle',
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
    deleting.value = id
    try {
      await $fetch('/api/auth/webauthn/link/invoke', {
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

  return {
    passkeys,
    status,
    creating,
    deleting,
    authenticating,
    registering,
    signInWithPasskey,
    registerWithPasskey,
    createPasskey,
    revokePasskey,
    invokePasskey,
  }
}
