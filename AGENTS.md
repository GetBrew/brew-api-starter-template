<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


## Brew integration

Current SDK contracts and setup are documented in [README.md](README.md).
Marketing signup requires explicit consent; welcome sends use `emails.send`
and verified marketing domains. Reuse idempotency keys for retries. Never
contact the live API in tests. Keep admin reads behind the proxy guard and
credentials server-side. Run checks appropriate to the change; CI runs
`npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
