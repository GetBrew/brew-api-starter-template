import { BrewApiError, type RequestOptions, type SendEmailInput, type SendEmailResponse, type UpsertContactInput } from '@brew.new/sdk'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  marketingConsent: z.literal(true),
})

type Config = { apiKey?: string; emailId?: string; domainId?: string }
type SignupClient = {
  upsertContact: (input: UpsertContactInput, options: RequestOptions) => Promise<unknown>
  sendEmail: (input: SendEmailInput, options: RequestOptions) => Promise<SendEmailResponse>
}

export function createSignupHandler(config: Config, getClient: () => SignupClient) {
  return async (request: Request): Promise<Response> => {
    if (!config.apiKey || !config.emailId || !config.domainId) {
      return Response.json({ error: 'Welcome email service is not configured.' }, { status: 503 })
    }
    const key = z.uuid().safeParse(request.headers.get('Idempotency-Key'))
    if (!key.success) return Response.json({ error: 'A UUID Idempotency-Key is required.' }, { status: 400 })
    let body: unknown
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Valid contact details and explicit marketing consent are required.' }, { status: 400 })
    const { email, firstName, lastName } = parsed.data
    try {
      const client = getClient()
      await client.upsertContact({ email, firstName, lastName, subscribed: true, customFields: { source: 'signup' } }, { idempotencyKey: `signup-contact:${key.data}`, signal: request.signal })
      const result = await client.sendEmail({ emailId: config.emailId, domainId: config.domainId, subject: `Welcome, ${firstName}!`, to: [email] }, { idempotencyKey: `signup-welcome:${key.data}`, signal: request.signal })
      if (!('sendId' in result)) return Response.json({ error: 'Unexpected welcome email response.' }, { status: 502 })
      return Response.json({ success: true, sendId: result.sendId, status: result.status }, { status: 202 })
    } catch (error) {
      if (request.signal.aborted) throw request.signal.reason
      if (error instanceof BrewApiError) {
        return Response.json({ error: error.message, code: error.code, param: error.param }, { status: error.status })
      }
      return Response.json({ error: 'Welcome email service is unavailable. Retry with the same submission.' }, { status: 502 })
    }
  }
}
