# Brew welcome email starter

A Next.js demo that records an explicit marketing opt-in and queues a saved
welcome email through the current Brew TypeScript SDK. This is a marketing
signup flow. Transactional receipts and account notifications instead use a
published event automation on a transactional-purpose domain.

## Setup

1. Run `npm ci`.
2. In [Brew API settings](https://brew.new/settings/api), create a **brand-scoped**
   key with `contacts`, `emails`, and `sends` permissions. The optional admin
   screens also need `domains` and `audiences` read access.
3. Create a welcome design in Brew and copy its **emailId** from the design's
   details. Workspace URLs may identify a group or canvas, so do not infer an
   emailId from a URL segment.
4. Register and verify a **marketing-purpose** sending domain and copy its domainId.
   The welcome design needs an unsubscribe link for a live marketing send.
5. Copy `.env.example` to `.env.local` and fill in the credentials and IDs.
   Set a separate, strong admin password to enable the admin screens.
6. Run `npm run dev` and submit the form. The checkbox is required. Contact
   upsert records `source: "signup"`; Brew defines that custom field automatically.
   The SDK's `emails.send` queues the welcome email and returns a sendId.

The optional Signups audience is a saved filter where `source` equals `signup`.
The form does not create an application account. In a real application, run
this integration after your own signup and consent checks and protect the
public submission boundary with your application's abuse controls.

## Environment

```env
BREW_API_KEY=your_brand_scoped_key
BREW_WELCOME_EMAIL_ID=your_email_id
BREW_DOMAIN_ID=your_verified_marketing_domain_id
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_separate_strong_admin_password
```

Keep credentials server-side and out of Git. Admin credentials protect
`/admin` and `/admin/contacts` through the Next proxy; access fails closed when
those credentials are absent. Use HTTPS when deploying Basic authentication,
or replace it with your application's session authentication.

## Request and retry behavior

`POST /api/signup` requires `email`, `firstName`, `lastName`,
`marketingConsent: true`, and a UUID `Idempotency-Key` header. Invalid input
causes no Brew calls. The contact upsert and welcome send have separate stable
keys derived from that UUID. The form retains the key when retrying an unchanged
failed submission and creates a fresh one for a new intended submission.

A `202` response means **queued**, not delivered. It returns
`{ success: true, sendId, status }`; follow the send with `brew.sends.get(sendId)`.
Do not invent a new key after an uncertain outcome merely to retry it.

## Validation and deployment

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Tests use injected SDK seams and a mocked fetch; they never contact the Brew
API. CI runs typecheck, lint, tests, and a production build. Deploy to Vercel
with the environment values above and redeploy after changing them.

Generate or edit the saved welcome design before serving signup traffic. To
personalize it, use merge tags from contact properties. A new AI generation
on every signup adds latency and credits and is not part of this demo.
