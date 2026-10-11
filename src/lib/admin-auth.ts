import { createHash, timingSafeEqual } from 'node:crypto'

export function hasAdminCredentials(authorization: string | null, username: string, password: string): boolean {
  if (!username || !password || !authorization || authorization.length > 2048 || !/^Basic /i.test(authorization)) return false
  const supplied = Buffer.from(authorization.slice(6), 'base64').toString('utf8')
  const hash = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(hash(supplied), hash(`${username}:${password}`))
}
