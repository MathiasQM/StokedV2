import { eq, gte, lt, and } from 'drizzle-orm'

export const getBriefAudio = async (userId: string) => {
  try {
    // Define range for the given day (so we don't need an exact timestamp match)

    // 1. Find the brief for this user/day
    const [record] = await useDB()
      .select()
      .from(tables.dailyBriefs)
      .where(eq(tables.dailyBriefs.userId, userId))

    if (!record) return null

    const path = record.audioUrl
    if (!path) return null

    // Option A: get a public URL (preferred if bucket is public) TODO MAKE PRIVATE
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('brief_audio')
      .getPublicUrl(path as string)
    console.log('Public URL data:', publicUrlData.publicUrl)
    return { ...record, audioUrl: publicUrlData.publicUrl }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find or fetch daily brief audio')
  }
}

export const deleteExpiredBriefs = async (userId: string) => {
  try {
    const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8) // 8 days

    await useDB()
      .delete(tables.dailyBriefs)
      .where(
        and(
          eq(tables.dailyBriefs.userId, userId),
          lt(tables.dailyBriefs.createdAt, eightDaysAgo),
        ),
      )
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete expired daily briefs')
  }
}
