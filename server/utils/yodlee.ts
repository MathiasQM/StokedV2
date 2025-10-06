export function getYodleeLoginName(userId: string): string {
  return `user_${userId}` // or hash the userId/email
}
