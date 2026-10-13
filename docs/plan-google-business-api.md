# Plan: getting ready for the Google Business Profile API

Goal: by the end of tomorrow, everything Google needs from us is submitted, and we've made the
architecture decisions, so the integration can start as soon as access is approved.

## Facts to keep in mind

- **Use the Business Profile API, not the Places API.** Places only returns about 5 reviews and
  can't reply. The Business Profile API lists every review and lets you reply from Toque. Reviews
  live in the `mybusiness.googleapis.com/v4` endpoints (`reviews.list`, `reviews.updateReply`).
- **Access has to be approved by Google.** Until then the API quota is 0, and approval can take
  days or weeks. This is the bottleneck, so the access request is task #1.
- **Reporting can't be automated.** There's no API to report a review. Toque will deep-link the
  owner to the review instead.
- **OAuth scope:** `https://www.googleapis.com/auth/business.manage`. It's a sensitive scope:
  - In *Testing* mode we can use up to 100 test users, but their logins expire after 7 days.
  - Publishing for real clients needs Google's app verification, which requires a domain we own,
    a privacy policy and terms of service.
- **New reviews can be pushed to us** through Pub/Sub notifications (new or updated review), so
  we don't have to poll.

## Tomorrow's checklist

### 1. Access request (first thing)
- [ ] Create a Google Cloud project named `toque`.
- [ ] Find a business to test with: a **verified** Business Profile that you own or manage (yours,
      a relative's or a friendly client's). We can't build or test without one.
- [ ] Read the prerequisites on Google's Business Profile API access request page and submit the
      form with that business. Save the case number.
- [ ] Enable these APIs in the project: My Business Account Management, My Business Business
      Information and Google My Business (v4, for reviews).

### 2. Domain and legal pages
- [ ] Buy a domain (for example `toque.co` or `toqueapp.co`). Google won't accept `vercel.app` as
      an authorized domain for app verification.
- [ ] Connect it to the Vercel project and verify it in Google Search Console.
- [ ] Publish two simple pages: **Política de privacidad** (Ley 1581 de 2012, Habeas Data) and
      **Términos de uso**.

### 3. OAuth setup (Testing mode)
- [ ] Set up the OAuth consent screen: app name, logo, support email, the new domain, and links to
      the privacy and terms pages.
- [ ] Create an OAuth client (type *Web*) with redirect URIs for production and
      `http://localhost:5173`.
- [ ] Add yourself and the test business owner as test users.

### 4. Decisions to make together
| Decision | Options | Leaning |
|---|---|---|
| Backend | Vercel Functions vs separate server | Vercel Functions (same repo, same deploy) |
| Database | Supabase vs Neon Postgres (Vercel Marketplace) | Supabase: database, auth and row-level security in one place |
| Login | "Sign in with Google" only vs email + Google | Google only, since owners already need a Google account for their Business Profile |
| New-review sync | Pub/Sub push vs scheduled job (cron) every X min | Start with cron for simplicity, add Pub/Sub later |
| Review statuses | Stay in `localStorage` vs move to the database | Database (multi-device, team members); migrate existing statuses on first login |
| Token storage | Encrypted refresh tokens in the database | Required, never in the browser |
| Pricing (for later) | Free plan for 1 location + paid plan for WhatsApp/AI | To discuss |

### 5. While we wait for approval (code)
- [ ] Convert `public/data/reviews.json` to the real API shape (`reviewId`, `starRating: "FIVE"`,
      `comment`, `reviewer.displayName`, `createTime`, `updateTime`, `reviewReply`), so switching
      to real data only changes where the data comes from.
- [ ] Phase 0: "Reportar de todas formas" and "Esto no es ofensivo" buttons that save false
      positives and false negatives as new test cases.
- [ ] Collect real Colombian reviews (anonymized) for the detector tests.
- [ ] Draft the "Responder" flow: a text box in the card that will later call `reviews.updateReply`.

## What to bring tomorrow
- Access to a verified Business Profile (owner or manager role).
- A card for the domain purchase. The Google APIs themselves are free.
- 10 minutes to decide the table in section 4.
