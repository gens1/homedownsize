# Home Downsize — deploy to Cloudflare Pages

This site is a static front end plus one Cloudflare Pages Function that emails the
contact form (`functions/api/contact.js` → served at `/api/contact`).

## 1. Choose an email provider (Resend)

The function sends mail through [Resend](https://resend.com) — free tier is 100 emails/day.

1. Sign up at resend.com.
2. Add and verify your domain `homedownsize.co.nz` (Resend gives you DNS records;
   add them in your Cloudflare DNS dashboard). Verifying the domain lets you send
   from an address like `website@homedownsize.co.nz`.
3. Create an API key (Resend dashboard → API Keys).

> Prefer a different provider (SendGrid, Postmark, Mailgun, etc.)? Only the `fetch`
> call inside `contact.js` needs to change — the rest of the flow is identical.

## 2. Deploy the site to Pages

Option A — connect your Git repo:
1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Pick this repo. Build command: leave blank. Build output directory: `/` (root).
3. Deploy.

Option B — direct upload with Wrangler:
```
npm install
npx wrangler pages deploy .
```

## 3. Set environment variables

In the Pages project → Settings → Environment variables, add these for
**Production** (and Preview if you want):

| Name             | Example value                        | Notes                     |
|------------------|--------------------------------------|---------------------------|
| `RESEND_API_KEY` | `re_xxxxxxxx`                        | Mark as **Secret**        |
| `CONTACT_TO`     | `hello@homedownsize.co.nz`           | Where enquiries land      |
| `CONTACT_FROM`   | `website@homedownsize.co.nz`         | Must be on a verified domain |

Redeploy after adding variables so the Function picks them up.

## 4. Custom domain

Pages project → Custom domains → add `homedownsize.co.nz`. Since your DNS is already
on Cloudflare, this is a couple of clicks.

## Local development

Run the site + Function locally with Wrangler:
```
npm install
npm run dev
```
Then open the printed `http://localhost:8788`. To test real email locally, create a
`.dev.vars` file (git-ignored) with:
```
RESEND_API_KEY=re_xxxxxxxx
CONTACT_TO=you@example.com
CONTACT_FROM=website@homedownsize.co.nz
```
