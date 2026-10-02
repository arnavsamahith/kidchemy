# Kidchemy: what to change before the pilot, and after

*2 October 2026. Ranked by how much each item matters for two pilot schools this term. "Fully ready" = everything in sections 1 and 2.*

---

## 1. Why the orange, the old font and the missing logo still show on the live site

The teal palette, Source Serif 4 + Plus Jakarta Sans, and the Sprout-K logo are all in your code. They were never shipped.

- Your last git commit is **"changed fonts and philosophies", 12 Sep 2026**.
- The brand work (`index.css`, `index.html`, `AppShell.jsx`, `favicon.svg`, `public/logo/*`, `docs/BRAND.md`) was saved on **15 Sep**, after that commit, and is still uncommitted.
- Vercel only builds what is pushed to `main`, so kidchemy.vercel.app is still the 12 Sep version.

**Fix (in your edchemy folder):**

```bash
npm run build          # make sure it builds
git add .
git commit -m "Brand: teal palette, Sprout-K logo, new fonts, new landing page"
git push
```

Then hard-refresh the site (Ctrl+Shift+R). If the browser tab icon still looks old, that is the favicon cache; it updates within a day.

Before you push, add your photo as `public/about/arnav.jpg` (portrait, about 4:5) and fill in `college` and `linkedin` at the top of `src/pages/Landing.jsx` (the `FOUNDER` block).

---

## 2. Must do before a real school's children go in

| # | Change | Why |
| --- | --- | --- |
| 1 | **Verify the v3 schema and RLS are live in Supabase** (DEPLOY.md, v2/v3 smoke tests) | The v1 policy gave anonymous users read and write on everything. Confirm a signed-out visitor sees nothing. |
| 2 | **Public demo mode** (`/demo`): a read-only sample school with 20+ children and two terms of data, no login | Principals will want to click around after the meeting. Never demo on real children. |
| 3 | **Privacy page + terms page + parent consent template** | Schools will ask. Linked from the footer and the login page. |
| 4 | **WhatsApp share** of a child's profile link (a `wa.me` link with prefilled text) from the teacher side | The QR sticker is the ceremony; WhatsApp is how Indian parents actually receive things. |
| 5 | **OTP or access-code check on first scan**, opaque profile tokens (no guessable ids) | A child's profile is sensitive. Already planned in ROLLOUT.md phase 3; bring it forward. |
| 6 | **Offline queue for sweeps** (save locally, sync when online) | One lost sweep on school wifi loses you the teacher. |
| 7 | **Foundational-stage (KG to Class 2) prompts** | The landing page now says KG to Class 8. The tag set reads as primary/middle. Add play-based prompts (e.g. "Stayed with one activity for 10+ minutes", "Used words to solve a disagreement", "Tried something new at the art table") mapped to the PARAKH foundational domains. |
| 8 | **HPC export in the PARAKH layout per stage** (foundational, preparatory, middle), as a print/PDF | This is what the coordinator is buying. It has to look like the card they've seen in circulars. |
| 9 | **Error monitoring and backups** (Sentry free tier on teacher/admin pages only; Supabase daily backups on) | You can't sit next to the teacher every day. |
| 10 | **Custom domain and email** (e.g. kidchemy.in, hello@kidchemy.in) | A `vercel.app` link and a Gmail address cost you trust with principals. ~₹1,000 a year. |

---

## 3. Features to build during the pilot (in this order)

1. **Term "Growth Story" for parents.** A beautiful, shareable end-of-term card: three moments, the strongest branch of their child's tree, one thing to try next term. This is Gemini's "Spotify Wrapped" idea done the Kidchemy way: rule-based, every line traceable, built only from observations. It is the thing parents will forward, and forwarding is your best metric.
2. **Growth tree on the parent profile.** Replace or sit beside the radar chart with the branching tree from the landing page (branches grow as strengths show up; "not yet observed" is a dotted twig, never a gap). It is warmer than a radar, it matches the brand, and it says "branches, not a ladder".
3. **Child voice for young children.** HPC asks for self-assessment. For KG to Class 2, use faces or pictures ("How did you feel doing this?"). For Class 3+, three sentence starters ("I'm proud that...", "I found it hard to...", "Next I want to...").
4. **Parent voice.** A two-question form sent over WhatsApp before the PTM ("What has your child been excited about at home?"). Feeds the HPC's parent section and makes parents feel heard.
5. **Photo of work.** `observations.artefact_url` already exists; let the teacher attach one photo of a drawing or model. Parents care about seeing the work far more than any chart.
6. **Coverage view for the principal.** Which classes are being observed, which children haven't been seen in four weeks. No teacher league tables.
7. **Hindi + one regional language** via the phrase bank (ROLLOUT.md item 3). Pick the language of your pilot schools' parents.

**Deliberately later (as you said):** voice notes, AI tag suggestions, AI prose. When you add them, keep the rule: AI suggests, the teacher confirms, every sentence still traces to an observation.

---

## 4. Branding

- **Keep it consistent everywhere:** Sprout-K, teal `#0E6E70`, moss `#3D7A53`, paper `#F6F4EF`, Source Serif 4 for headings, Plus Jakarta Sans for everything else, no orange. One sample child across website, deck and one-pager: **Meera, Class 3B**.
- **Tagline:** "A truer picture of every child." Headline line: "Every child is more than the number on their report card."
- **Write in verbs, never labels** ("rebuilds it until it holds", never "creative child"). This is already your brand rule; it is also the strongest thing in your copy.
- **Social preview image** (`og:image`, 1200x630): the growth tree + headline. Right now a shared link shows nothing.
- **Print kit** in the same style: QR report-card sticker, PTM sheet, one-pager, pilot letter. Schools judge you on paper as much as on screen.
- **Photography rule:** no stock photos of children. Your own photo on the About section, real (consented) classroom photos from pilots later.
- **A short founder video** (60 to 90 seconds, phone camera, natural light) for the About section and LinkedIn once you have the pilot.

---

## 5. Business model to say out loud

- **Schools pay, parents never do.** Founding price ₹150 to ₹250 per student per year, locked for two years for the first five schools.
- **Later tiers:** a lower-priced plan for budget private schools (NISA segment), and a multi-campus plan for chains.
- **Keep the two DPDP-sensitive ideas separate** (premium parent counselling, aggregate insights for government/NGOs). They sit outside the education exemption and need their own consent and data path (ROLLOUT.md phase 3).

---

## 6. What the new landing page does (shipped to `src/pages/Landing.jsx`)

- Editorial hero with masked line reveals. A "58%" dissolves and a child's **growth tree** draws itself in its place; each branch shows the actual teacher observation behind it (cycles automatically, hover or tap to explore).
- Slow marquee of strengths written as verbs.
- **01 Problem**: teacher, parent, child.
- **02 For everyone**: tabs for school leaders, teachers, parents and children, each with their pain, four benefits and a small live visual (HPC card, animated class sweep, parent phone view, "Rank 27 of 40" crossed out).
- **03 How it works**: four numbered steps.
- **04 HPC band**: a teal panel that opens from a framed window to full width as you scroll, with the five PARAKH domains and Stream, Mountain, Sky.
- **05 Sample profile**: a letter-style excerpt for Meera.
- **06 Trust**: four honesty decisions + the frameworks it is built on.
- **07 About**: your photo, story, vision, Now / Next / Always goals. Edit the `FOUNDER` block at the top of the file.
- **08 Pilot**: the offer, with a "Book a pilot conversation" button that opens a prefilled email to you.
- All motion turns off for people who have "reduce motion" set.

The About text is a draft written from the product's own story. Read every line and change anything that isn't true to you, especially "Like most of us, I grew up in a system that...". Add your college and the real moment that started this; a specific moment beats a general belief.
