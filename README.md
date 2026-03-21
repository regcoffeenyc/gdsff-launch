# GDSFF Media & Communications Bot

Internal media, social, and communications workspace for the Georgian Dynamic Shooting & Functional Fitness Federation (GDSFF).

This project now includes:
- the public GDSFF website
- a protected internal admin workspace for Facebook, Instagram, and official email operations
- a lightweight local API/server with JSON-backed storage

## What Works Now

### Admin workspace
- Protected admin sign-in with setup mode placeholder auth
- Dashboard with pending emails, urgent items, follow-up counts, scheduled posts, and recent activity
- Social content module with:
  - draft editor
  - approval status flow
  - schedule queue structure
  - preview card
  - list/calendar planning view
  - media asset library
  - AI-assisted draft generation
  - social reply suggestion helper
- Email module with:
  - inbox-style message list
  - message detail/editor
  - real inbox sync trigger for Microsoft 365 and Titan/IMAP
  - keyword-based classification
  - reply-draft generation from templates
  - notes, priority, status, and assignment fields
- Contacts/leads module with export support
- Templates module for social and email templates
- Settings module for Meta, email, and follow-up workflow configuration

### Backend/API
- Local JSON persistence in `server/data/social-state.local.json`
- Session placeholder auth with bearer token flow
- Social post save/status/schedule endpoints
- Queue processing endpoint for dry-run publishing
- Email message save/classify/reply-draft endpoints
- Microsoft 365 inbox sync endpoint (`/api/email/sync`)
- Titan/IMAP inbox sync endpoint (`/api/email/sync`)
- Contact save/export endpoints
- Template save endpoint
- Meta webhook verification/capture endpoints
- Vercel-compatible membership API functions under `api/` with durable Blob-ready storage support

## What Is Still Placeholder Only

- Real Gmail / IMAP inbox sync adapters
- Full Meta OAuth token exchange and secure token persistence
- Production-grade database storage
- Background scheduler/worker process
- Live publishing without configured Meta credentials

Outbound membership notification email now exists, but it still requires valid SMTP credentials and a deployed API to send real messages.

The app does **not** pretend to control Facebook, Instagram, or email accounts unless credentials and live integrations are actually configured.

## Routes

- Public site: `#/`
- Internal workspace: `#/social-hub`
- Internal workspace alias: `#/media-bot`

## Local Run

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
copy .env.example .env
```

Start the API:

```bash
npm run social:api
```

Start the frontend:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Environment Variables

Core:
- `VITE_GDSFF_API_BASE`
- `VITE_SOCIAL_API_BASE`
- `CLIENT_ORIGIN`
- `SOCIAL_HUB_PORT`

Admin auth:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

AI:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Email placeholders:
- `EMAIL_PROVIDER`
- `EMAIL_INBOX_ADDRESS`
- `EMAIL_OUTBOUND_ADDRESS`
- `EMAIL_MEMBERSHIP_NOTIFICATION_ADDRESS`
- `BLOB_READ_WRITE_TOKEN`
- `ADMIN_SESSION_SECRET`
- `EMAIL_SMTP_HOST`
- `EMAIL_SMTP_PORT`
- `EMAIL_SMTP_SECURE`
- `EMAIL_SMTP_STARTTLS`
- `EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED`
- `EMAIL_SMTP_USERNAME`
- `EMAIL_SMTP_PASSWORD`
- `EMAIL_IMAP_HOST`
- `EMAIL_IMAP_PORT`
- `EMAIL_IMAP_TLS`
- `EMAIL_IMAP_USERNAME`
- `EMAIL_IMAP_PASSWORD`
- `TITAN_MAILBOX_ADDRESS`
- `TITAN_IMAP_HOST`
- `TITAN_IMAP_PORT`
- `TITAN_IMAP_TLS`
- `TITAN_IMAP_USERNAME`
- `TITAN_IMAP_PASSWORD`
- `TITAN_SMTP_HOST`
- `TITAN_SMTP_PORT`
- `TITAN_SMTP_SECURE`
- `TITAN_SMTP_STARTTLS`
- `TITAN_SMTP_TLS_REJECT_UNAUTHORIZED`
- `TITAN_SMTP_USERNAME`
- `TITAN_SMTP_PASSWORD`
- `M365_TENANT_ID`
- `M365_CLIENT_ID`
- `M365_CLIENT_SECRET`
- `M365_MAILBOX_ADDRESS`
- `M365_SCOPE`
- `M365_GRAPH_BASE_URL`

Meta placeholders:
- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_VERIFY_TOKEN`
- `META_GRAPH_VERSION`
- `META_PAGE_ACCESS_TOKEN`
- `META_INSTAGRAM_ACCESS_TOKEN`

## Setup Mode

If `ADMIN_USERNAME` and `ADMIN_PASSWORD` are not set, the workspace runs in setup mode.

In setup mode:
- any non-empty username/password can sign in
- the UI clearly shows that protected mode is not fully configured yet

This keeps the tool usable locally without falsely claiming hardened auth.

## File Structure

- `src/pages/SocialHubPage.jsx`: main admin workspace UI
- `src/utils/socialHubApi.js`: frontend API client
- `server/index.js`: internal API server
- `server/lib/socialStore.js`: JSON state store and summary builder
- `server/lib/defaultState.js`: seeded operational workspace data
- `server/lib/emailWorkflow.js`: email classification and reply-template logic
- `server/lib/imapEmail.js`: Titan/IMAP inbox sync adapter
- `server/lib/microsoftGraphEmail.js`: Microsoft 365/Outlook inbox sync adapter
- `server/lib/scheduleQueue.js`: scheduled publish queue processing
- `server/lib/socialAi.js`: AI drafting and reply helpers
- `server/lib/metaGraph.js`: Meta publishing and webhook helpers
- `src/content/socialHubLaunchPack.js`: GDSFF official launch pack data

## Future Integration Path

### Email
Add one provider adapter at a time:
- Gmail SMTP (app password)
- IMAP sync

Recommended next steps:
- inbox fetch/sync job
- message threading and attachments

For the public membership page in production:
- deploy the API from `server/`
- set `VITE_GDSFF_API_BASE` if the frontend and API are on different origins
- configure explicit SMTP credentials so membership submissions can email `office@gdsff.org`

## Vercel Production Setup

For Vercel, the public membership system now has a serverless path in `api/`.

Recommended setup:
1. Deploy the project to Vercel normally as a Vite app.
2. Create a private Vercel Blob store for membership data.
3. Add these environment variables in Vercel:
   - `VITE_GDSFF_API_BASE=https://your-domain`
   - `BLOB_READ_WRITE_TOKEN`
   - `EMAIL_INBOX_ADDRESS=office@gdsff.org`
   - `EMAIL_OUTBOUND_ADDRESS=office@gdsff.org`
   - `EMAIL_MEMBERSHIP_NOTIFICATION_ADDRESS=metreveligod@gmail.com`
   - `EMAIL_SMTP_HOST`
   - `EMAIL_SMTP_PORT`
   - `EMAIL_SMTP_USERNAME`
   - `EMAIL_SMTP_PASSWORD`
   - `EMAIL_PROVIDER`
   - `ADMIN_SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
4. Redeploy after the environment variables are saved.

Important:
- membership delivery uses SMTP only
- IMAP credentials are for inbox sync only
- do not rely on IMAP passwords to send outgoing membership emails

What this enables on Vercel:
- `POST /api/membership/applications` stores the application and sends the notification email
- `GET /api/membership/summary` returns the live count for the membership page and homepage preview
- admin auth and membership review routes continue to work through same-origin `/api/...` calls

## Microsoft 365 Inbox Setup (Real Sync)

This project includes a real Microsoft 365 inbox sync path using Microsoft Graph with app credentials.

Required from your Microsoft 365/Azure administrator:
1. Azure tenant ID (`M365_TENANT_ID`)
2. App (client) ID (`M365_CLIENT_ID`)
3. Client secret (`M365_CLIENT_SECRET`)
4. Mailbox address to sync (`M365_MAILBOX_ADDRESS`) set to `office@gdsff.org`
5. Application permission `Mail.Read` on Microsoft Graph
6. Admin consent granted for the app permissions

Recommended production hardening:
1. Limit mailbox scope with an Application Access Policy so the app can access only `office@gdsff.org`
2. Store secrets in a secure secret manager (not plain env files on shared hosts)
3. Rotate client secrets regularly

Local configuration:
1. Set `EMAIL_PROVIDER=microsoft365`
2. Set `EMAIL_INBOX_ADDRESS=office@gdsff.org`
3. Fill `M365_TENANT_ID`, `M365_CLIENT_ID`, `M365_CLIENT_SECRET`, and `M365_MAILBOX_ADDRESS`
4. Start API with `npm run social:api`
5. In the admin UI, open `#/media-bot` and click `Sync Microsoft 365 Inbox` in the Email Inbox section

## Titan Inbox Setup (Real Sync via IMAP)

Titan sync is implemented using secure IMAP over TLS.

Required values:
1. `EMAIL_PROVIDER=titan`
2. `EMAIL_INBOX_ADDRESS=office@gdsff.org`
3. `EMAIL_IMAP_HOST=imap.titan.email` (or `TITAN_IMAP_HOST`)
4. `EMAIL_IMAP_PORT=993`
5. `EMAIL_IMAP_TLS=true`
6. `EMAIL_IMAP_USERNAME` (usually the full mailbox address)
7. `EMAIL_IMAP_PASSWORD` (use app password if your Titan setup requires it)

For outgoing membership email with Titan, also set:
- `EMAIL_SMTP_HOST=smtp.titan.email`
- `EMAIL_SMTP_PORT=465`
- `EMAIL_SMTP_SECURE=true`
- `EMAIL_SMTP_USERNAME` (usually `office@gdsff.org`)
- `EMAIL_SMTP_PASSWORD`

Optional Titan-specific aliases:
- `TITAN_IMAP_USERNAME`
- `TITAN_IMAP_PASSWORD`
- `TITAN_MAILBOX_ADDRESS`

Run flow:
1. Start API with `npm run social:api`
2. Open `#/media-bot`
3. In Settings set provider to `titan` and save
4. In Email Inbox click `Sync Titan Inbox`

## Gmail SMTP Setup (Optional Alternative)

Keep Titan as the primary GDSFF provider unless you intentionally decide to run an alternate SMTP mailbox.

Required values:
1. `EMAIL_PROVIDER=gmail`
2. `EMAIL_INBOX_ADDRESS=office@gdsff.org` (or your target inbox)
3. `EMAIL_OUTBOUND_ADDRESS=office@gdsff.org` (or the mailbox that sends the message)
4. `EMAIL_MEMBERSHIP_NOTIFICATION_ADDRESS=metreveligod@gmail.com`
5. `EMAIL_SMTP_HOST=smtp.gmail.com`
6. `EMAIL_SMTP_PORT=465`
7. `EMAIL_SMTP_SECURE=true`
8. `EMAIL_SMTP_USERNAME` (full Gmail address)
9. `EMAIL_SMTP_PASSWORD` (Google app password)

Notes:
- enable 2-Step Verification on the Gmail account first
- generate an app password and use that instead of the normal Gmail password
- Gmail SMTP is for sending; add IMAP only if you also want inbox sync

### Meta
Recommended next steps:
- OAuth code exchange
- page/account discovery
- encrypted token persistence
- scheduled background publisher
- comment/DM webhook routing

### Data layer
Recommended next steps:
- move from local JSON to SQLite or PostgreSQL
- add audit trail table
- add role-based access controls

## Verification Performed

- `vite build` completed successfully
- API health endpoint responded successfully
- setup-mode login plus protected admin state retrieval responded successfully
