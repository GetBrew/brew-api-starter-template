import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createBrewClient } from '@brew.new/sdk'
import { createSignupHandler } from '../src/lib/signup'

const config = { apiKey: 'test-only', emailId: 'eml_welcome', domainId: 'dom_marketing' }
const key = '8a8c96dd-d55e-40c6-98e4-4b842397e51a'
const body = { email: 'person@example.com', firstName: 'Test', lastName: 'Person', marketingConsent: true }

function harness(overrides = {}) {
  const calls: Array<{ method: string; input: unknown; options: unknown }> = []
  const handler = createSignupHandler({ ...config, ...overrides }, () => ({
    upsertContact: async (input, options) => { calls.push({ method: 'upsert', input, options }) },
    sendEmail: async (input, options) => { calls.push({ method: 'send', input, options }); return { status: 'queued', sendId: 'send_test' } },
  }))
  return { handler, calls }
}
function request(value: unknown = body, idempotencyKey = key) {
  return new Request('http://localhost/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(value) })
}

test('rejects invalid input and missing consent before performing network work', async () => {
  for (const input of [{ ...body, email: 'invalid' }, { ...body, marketingConsent: false }, { ...body, marketingConsent: undefined }]) {
    const { handler, calls } = harness()
    assert.equal((await handler(request(input))).status, 400)
    assert.deepEqual(calls, [])
  }
})
test('rejects missing configuration and invalid idempotency keys without network work', async () => {
  const { handler, calls } = harness({ emailId: undefined })
  assert.equal((await handler(request())).status, 503)
  assert.deepEqual(calls, [])
  const valid = harness()
  assert.equal((await valid.handler(request(body, ''))).status, 400)
  assert.deepEqual(valid.calls, [])
})
test('uses the current SDK send contract and stable keys for both writes', async () => {
  const { handler, calls } = harness()
  const response = await handler(request())
  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), { success: true, sendId: 'send_test', status: 'queued' })
  assert.equal(calls[0].method, 'upsert')
  assert.deepEqual(calls[0].input, { email: body.email, firstName: body.firstName, lastName: body.lastName, subscribed: true, customFields: { source: 'signup' } })
  assert.equal(calls[1].method, 'send')
  assert.deepEqual(calls[1].input, { emailId: config.emailId, domainId: config.domainId, subject: 'Welcome, Test!', to: [body.email] })
  assert.equal((calls[0].options as { idempotencyKey: string }).idempotencyKey, 'signup-contact:' + key)
  assert.equal((calls[1].options as { idempotencyKey: string }).idempotencyKey, 'signup-welcome:' + key)
})
test('does not send if contact upsert fails', async () => {
  let sent = false
  const handler = createSignupHandler(config, () => ({ upsertContact: async () => { throw new Error('unavailable') }, sendEmail: async () => { sent = true; return { status: 'queued', sendId: 'send_test' } } }))
  assert.equal((await handler(request())).status, 502)
  assert.equal(sent, false)
})


test('the installed SDK sends the expected HTTP requests without live network access', async () => {
  const calls: Array<{ path: string; key: string | null; method?: string; body: unknown }> = []
  const brew = createBrewClient({ apiKey: 'test-only', baseUrl: 'https://example.invalid/api', maxRetries: 0, fetch: async (url, init) => {
    const path = new URL(String(url)).pathname
    assert.ok(path === '/api/v1/contacts' || path === '/api/v1/sends', path)
    calls.push({ path, key: new Headers(init?.headers).get('Idempotency-Key'), method: init?.method, body: JSON.parse(String(init?.body)) })
    return Response.json(path.endsWith('/contacts') ? { contact: { email: body.email }, created: true, fieldsCreated: [] } : { status: 'queued', sendId: 'send_test' }, { status: path.endsWith('/contacts') ? 201 : 202 })
  } })
  const handler = createSignupHandler(config, () => ({ upsertContact: brew.contacts.upsert, sendEmail: brew.emails.send }))
  const response = await handler(request())
  assert.equal(response.status, 202, JSON.stringify(calls))
  assert.deepEqual(calls.map(call => [call.path, call.method, call.key]), [['/api/v1/contacts', 'POST', 'signup-contact:' + key], ['/api/v1/sends', 'POST', 'signup-welcome:' + key]])
})
