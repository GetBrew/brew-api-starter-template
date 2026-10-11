import { getBrewClient } from '@/lib/brew'
import { createSignupHandler } from '@/lib/signup'

export async function POST(request: Request) {
  return createSignupHandler({ apiKey: process.env.BREW_API_KEY, emailId: process.env.BREW_WELCOME_EMAIL_ID, domainId: process.env.BREW_DOMAIN_ID }, () => {
    const brew = getBrewClient()
    return { upsertContact: brew.contacts.upsert, sendEmail: brew.emails.send }
  })(request)
}
