import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasAdminCredentials } from '../src/lib/admin-auth'

test('admin access fails closed and requires both credentials', () => {
  const basic = (value: string) => 'Basic ' + Buffer.from(value).toString('base64')
  assert.equal(hasAdminCredentials(null, 'admin', 'secret'), false)
  assert.equal(hasAdminCredentials(basic('admin:secret'), '', 'secret'), false)
  assert.equal(hasAdminCredentials(basic('admin:wrong'), 'admin', 'secret'), false)
  assert.equal(hasAdminCredentials('Bearer secret', 'admin', 'secret'), false)
  assert.equal(hasAdminCredentials(basic('admin:secret'), 'admin', 'secret'), true)
})
