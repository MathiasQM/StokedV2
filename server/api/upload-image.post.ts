import { ensureBlob } from '@@/server/utils/ensureBlob'
import { env } from '~~/env'
export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const form = await readFormData(event)
  const image = form.get('image')
  if (!(image instanceof Blob)) {
    throw new Error('Image is not a Blob')
  }
  try {
    ensureBlob(image, {
      maxSize: '1MB',
      types: ['image/png', 'image/jpeg', 'image/webp'],
    })
  } catch (error: unknown) {
    throw createError({
      statusCode: 400,
      statusMessage: (error as Error).message || (error as string),
    })
  }
  const key = `uploads/${Date.now()}-${image.name}`

  await useStorage('s3Storage').setItemRaw(key, image)
  return `${env.S3_PUBLIC_ENDPOINT}/${key}`
})
