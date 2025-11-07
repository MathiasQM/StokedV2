import { getBriefAudio } from '@@/server/database/queries/daily_briefs'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  console.log('Fetching brief for date:', user.id)
  // await deleteExpiredBriefs(user.id)
  return await getBriefAudio(user.id)
})
