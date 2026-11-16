# Home Downsize — deploy to Cloudflare Workers

The site runs as a Cloudflare Worker with static assets:

- `public/` holds the static site (HTML, CSS, JS, images).
- `src/index.js` is the Worker entry point. It sends `POST /api/contact` to the
  contact form handler and serves everything else from `public/`.
- `functions/api/contact.js` validates the form and emails it through Resend.
- `wrangler.jsonc` is the only Wrangler config file.

## 1. Set up Resend (email provider)

The contact form sends mail through [Resend](https://resend.com). The free tier allows 100 emails/day.

1. Sign up at resend.com.
2. Add and verify the domain `homedownsize.co.nz` (Resend → Domains). Resend gives
   you DNS records to add in your Cloudflare DNS dashboard. Once it's verified you
   can send from an address like `website@homedownsize.co.nz`.
3. Create an API key (Resend → API Keys) with **Sending access**. Copy it straight
   away, because Resend only shows it once.

> To test before the domain is verified, use `onboarding@resend.dev` as
> `CONTACT_FROM`. Resend will then only deliver to your Resend account's email,
> so `CONTACT_TO` must be that address.

## 2. Set the Worker's variables

In the Cloudflare dashboard, go to Workers & Pages → **homedownsize** → Settings →
**Variables and Secrets**, and add:

| Name             | Example value                | Notes                                      |
|------------------|------------------------------|--------------------------------------------|
| `RESEND_API_KEY` | `re_xxxxxxxx`                | Type **Secret**                            |
| `CONTACT_TO`     | `hello@homedownsize.co.nz`   | The inbox where enquiries are delivered    |
| `CONTACT_FROM`   | `website@homedownsize.co.nz` | Must be on a domain verified in Resend     |

You can set the secret from the terminal instead (run it in the project folder):
```
npx wrangler secret put RESEND_API_KEY
```

Replies to an enquiry go to the visitor, because the handler sets `reply_to` to
the email address they entered.

## 3. Deploy

Option A — Git: if the Worker is connected to this repo, pushing to `main`
deploys it. Under Settings → Build, leave the root directory blank (`/`). If it's
set to `/public`, the build can't find `wrangler.jsonc` and fails with
"Required Worker name missing".

Option B — from your machine:
```
npm install
npm run deploy
```

## 4. Custom domain

Go to Worker → Settings → **Domains & Routes** and add `homedownsize.co.nz`. The DNS is
already on Cloudflare, so this only takes a couple of clicks.

## Local development

```
npm install
npm run dev
```
Then open the URL that Wrangler prints (usually `http://localhost:8787`). To send real email
locally, create a `.dev.vars` file in the project folder (it's already git-ignored):
```
RESEND_API_KEY=re_xxxxxxxx
CONTACT_TO=you@example.com
CONTACT_FROM=website@homedownsize.co.nz
```
Without it, submitting the form returns "Email service is not configured yet."
That confirms the handler is running.
