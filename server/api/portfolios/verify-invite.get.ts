import {
  getInvite,
  updateInviteStatus,
  acceptPortfolioInvite,
  isPortfolioMember,
} from '~~/server/database/queries/portfolios'
import { findUserById, verifyUser } from '@@/server/database/queries/users'
import { z } from 'zod'

const querySchema = z.object({
  token: z.string().length(32, 'Invalid token'),
})

export default defineEventHandler(async (event) => {
  // 1. Validate token with type checking
  const { token } = await getValidatedQuery(event, querySchema.parse)

  // 2. Get and validate invite
  let invite
  try {
    invite = await getInvite(token)
  } catch (error) {
    return sendRedirect(
      event,
      `/auth/verification-error?message=${encodeURIComponent((error as Error).message)}`,
    )
  }

  // 3. Validate user session and permissions
  const session = await getUserSession(event)
  if (!session?.user || !(await findUserById(session.user.id))) {
    setCookie(event, 'invite-token', token, {
      maxAge: 60 * 60 * 24, // discard cookie after 1 day
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    })
    setCookie(event, 'invite-email', invite.email, {
      maxAge: 60 * 60 * 24, // discard cookie after 1 day
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    })
    return sendRedirect(event, '/auth/register', 302)
  }

  // 4. Check if user is already a portfolio member
  const isAlreadyMember = await isPortfolioMember(
    invite.portfolioId,
    session.user.id,
  )
  if (isAlreadyMember) {
    throw createError({
      statusCode: 400,
      statusMessage: 'You are already a member of this portfolio',
    })
  }

  // 5. Skip verifying user's email if they used an invite link
  if (invite.email === session.user.email) {
    verifyUser(session.user.id)
  }

  // 6. Process invite acceptance
  await acceptPortfolioInvite(invite, session.user.id)
  await updateInviteStatus(invite.id, 'accepted')
  deleteCookie(event, 'invite-token')
  deleteCookie(event, 'invite-email')

  return sendRedirect(event, '/dashboard', 302)
})
