import { NextResponse, type NextRequest } from 'next/server'
import { hasAdminCredentials } from './lib/admin-auth'

export function proxy(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (!username || !password) return new NextResponse('Admin access is not configured.', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  if (!hasAdminCredentials(request.headers.get('Authorization'), username, password)) return new NextResponse('Authentication required.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Brew admin", charset="UTF-8"', 'Cache-Control': 'no-store' } })
  return NextResponse.next()
}
export const config = { matcher: '/admin/:path*' }
