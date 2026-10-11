import 'server-only'
import { createBrewClient } from '@brew.new/sdk'

export function getBrewClient() {
  const apiKey = process.env.BREW_API_KEY
  if (!apiKey) throw new Error('BREW_API_KEY is required')
  return createBrewClient({ apiKey, timeoutMs: 30_000, maxRetries: 2 })
}
