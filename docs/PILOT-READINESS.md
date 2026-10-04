# Before you ask a school for a pilot

Tick these in order. Items marked **must** are blockers. Paths are the
dashboard menus as of Oct 2026. Background and reasons: docs/SECURITY.md.

## 1. GitHub (do first: it may already be leaking)

- [ ] **must** Make the repo **private** (Settings → General → Danger zone → Change visibility).
- [ ] **must** Stop committing children's data. Delete or move `dump/` and `my_inputs/` out of the repo, then add to `.gitignore`:
  ```
  dump/
  my_inputs/
  .env*
  !.env.example
  Claude outputs/
  ```
- [ ] **must** If the repo was **ever public**, the old commits still hold the Grade 7C names and sticker codes from `schema.sql` and `dump/`. Rewrite history (`git filter-repo --path dump --invert-paths`, and the same for the old roster lines) and force-push, or start a fresh repo. Either way, rotate every code (Supabase step 2.3). Treat it as a possible breach and tell the school if anyone outside could have seen it.
- [ ] **must** Commit and push the work since 12 Sep (`git add -A && git commit -m "v4: safety + new site" && git push`). Vercel deploys from git, so nothing goes live until you push.
- [ ] Turn on 2FA on your GitHub account (Settings → Password and authentication).
- [ ] Settings → Code security: Dependabot alerts, secret scanning, push protection: **on**.
- [ ] Settings → Branches: protect `main` (no force-push, PRs optional for a solo founder).

## 2. Supabase

**2.1 Plan and project**
- [ ] **must** Upgrade to **Pro** before the pilot. A free project pauses after a week of no activity (a school holiday is enough), and it has no daily backups.
- [ ] Check the region (Settings → General). If it is not **Mumbai (ap-south-1)**, a fresh project in Mumbai before real data arrives is the cheapest moment to move.
- [ ] Organization → Team: add a second owner you trust, so you are not the single point of failure.
- [ ] Turn on 2FA on your Supabase account.

**2.2 SQL** (SQL Editor)
- [ ] **must** Run `supabase/schema.sql`, then `supabase/security.sql`. Always both, in that order.
- [ ] **must** Make yourself admin (two lines at the bottom of schema.sql).
- [ ] Optional check: run `supabase/tests/` against a scratch project or local Postgres.

**2.3 Rotate what was public** (SQL Editor, section 9 of security.sql)
- [ ] **must** `select public.kc_rotate_access_code(id) from public.students;`
- [ ] **must** Replace or delete teacher code `VIDYA-7C`. Mint new codes at /admin/people with a use limit and an expiry date.

**2.4 Authentication**
- [ ] **must** Authentication → Emails → **SMTP Settings**: add a custom SMTP sender (Resend, Brevo, Zoho, or AWS SES) on your own domain. The built-in sender is limited to about 2 emails an hour and is meant for testing only, so teachers and parents will not get confirmation mails without it.
- [ ] **must** Authentication → Providers → Email: **Confirm email** on. Minimum password length **8**. **Leaked password protection** on (Pro).
- [ ] Authentication → Providers → Email: OTP / link expiry 3600 seconds or less.
- [ ] **must** Authentication → URL Configuration: Site URL = your production domain; Redirect URLs = that domain only (remove localhost before the pilot).
- [ ] Authentication → Multi-Factor: TOTP enabled (it usually is by default).
- [ ] Authentication → Rate Limits: keep the defaults or lower them.
- [ ] Optional: Authentication → Attack Protection → CAPTCHA (Cloudflare Turnstile). This also needs a small change in the app (pass `captchaToken`) and a CSP entry for `challenges.cloudflare.com`. Ask me when you want it.
- [ ] Authentication → Emails → Templates: rewrite the confirm and reset mails in plain words, with Kidchemy and the school's name.

**2.5 Database settings**
- [ ] Database → Settings → **SSL enforcement**: on.
- [ ] Database → Settings → Network restrictions: allow only your own IP for direct connections (the app uses the API, not direct connections, so this does not affect it).
- [ ] Database → Extensions: enable **pg_cron**, then in the SQL Editor:
  `select cron.schedule('kc-retention', '30 20 * * *', 'select public.kc_apply_retention()');` (2 am IST nightly).
- [ ] Settings → Add-ons: Point-in-Time Recovery if you can afford it; otherwise check the daily backups are listed under Database → Backups.
- [ ] Advisors → **Security Advisor** and **Performance Advisor**: run both and fix anything marked error.
- [ ] Database → Publications: make sure no children's tables are in a realtime publication (the app does not use realtime).

**2.6 Paperwork**
- [ ] Sign Supabase's **DPA** (from the organization's legal documents page in the dashboard, or supabase.com/legal/dpa). You will list Supabase as a sub-processor in your agreement with the school.

## 3. Vercel

- [ ] **must** Settings → Environment Variables (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Then the fallback keys in `src/data/supabase.js` are only for local dev.
- [ ] **must** A custom domain (e.g. `kidchemy.in`) instead of `kidchemy.vercel.app`. Schools trust it more, and HSTS preload needs it. Add the same domain in Supabase URL Configuration and your SMTP sender.
- [ ] **must** After deploy, check the security headers are live:
  `curl -sI https://your-domain | grep -iE "content-security|strict-transport|x-frame"`
  Then open the site, sign in as each role, and look at the browser console for CSP errors (fonts, Supabase). Tell me if anything is blocked.
- [ ] Settings → Deployment Protection: **Vercel Authentication on Preview deployments**, so preview URLs with test data are not public.
- [ ] Do not turn on Vercel Analytics or Speed Insights. The privacy notice says "no trackers". If you ever want them, the notice changes first.
- [ ] Turn on 2FA on your Vercel account. Git → only `main` deploys to production.

## 4. The platform

- [ ] **must** Run `npm run build` locally once (I could not build in my workspace; the code was checked with a bundler and screenshots).
- [ ] **must** Turn on two-step sign-in for your admin account at /admin/privacy, right after you first sign in.
- [ ] **must** Fill in `SCHOOL_CONTACT` in `src/data/privacy.js`, and the grievance officer at /admin/privacy. The DPDP Act expects families to know whom to contact.
- [ ] **must** Import the real roster from /teacher/roster (never via SQL files), then print fresh stickers from /teacher/stickers.
- [ ] **must** Test every role end to end with dummy accounts before any real data:
  - Teacher: sign up with code → sweep → write a note mentioning "ADHD" (warning should appear) → mark school-only.
  - Parent: link with a wrong first name 5 times (should lock for an hour) → link correctly → only shared notes visible → Download → Withdraw (page should disappear).
  - Teacher of another school: cannot see the first school's children.
  - Admin: request appears at /admin/privacy with a due date; idle 30 minutes and get signed out.
- [ ] Put your photo at `public/about/arnav.jpg`, and your college and LinkedIn in the `FOUNDER` block of `Landing.jsx`.
- [ ] Later, not blocking: self-host Instrument Serif and Satoshi in `public/fonts` and remove the two font links from `index.html`.

## 5. With the school (before the first child is entered)

- [ ] **must** A signed **processing agreement**: the school is the Data Fiduciary, Kidchemy the processor (outline in SECURITY.md §6). Have a lawyer look at it once; reuse it for every school.
- [ ] **must** The school sends families the privacy notice (/privacy) in English **and** the language most of them read, before stickers go home.
- [ ] Get written approval from the principal to run the pilot in the named class, and the name of the school's safeguarding lead.
- [ ] A 20-minute teacher briefing: school-only for concerns; never health, caste, religion, family or phone numbers in notes; anything about a child's safety goes to the safeguarding lead in person, not into the app.
- [ ] Agree on the end of the pilot: what happens to the data if the school does not continue (default: export to the school, then erase within 30 days).

## 6. On the day you ask

- [ ] The site loads on a cheap Android phone on mobile data.
- [ ] "Pilot with us" opens your email with the school template.
- [ ] You can show the school: the sample profile, the privacy notice, the "who sees what" section, and the signed agreement template. Those four answer most principals' first questions.
