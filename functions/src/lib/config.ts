import { defineSecret } from 'firebase-functions/params'

export const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')
export const EOD_API_KEY = defineSecret('EOD_API_KEY')
export const EOD_BASE_URL = defineSecret('EOD_BASE_URL')
export const STORAGE_BUCKET_FIREBASE = defineSecret('STORAGE_BUCKET_FIREBASE')
export const ELEVENLABS_API_KEY = defineSecret('ELEVENLABS_API_KEY')
export const ELEVENLABS_VOICE_ID_NARRATOR = defineSecret(
  'ELEVENLABS_VOICE_ID_NARRATOR',
)
export const ELEVENLABS_MODEL_ID = defineSecret('ELEVENLABS_MODEL_ID')

export const REQUIRED_SECRETS = [
  OPENAI_API_KEY.name,
  EOD_API_KEY.name,
  EOD_BASE_URL.name,
  STORAGE_BUCKET_FIREBASE.name,
  ELEVENLABS_API_KEY.name,
  ELEVENLABS_VOICE_ID_NARRATOR.name,
  ELEVENLABS_MODEL_ID.name,
] as const
