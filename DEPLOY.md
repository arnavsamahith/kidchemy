# Deploying Kidchemy

Vite builds a folder of static files. Supabase is the backend and is already
live. So "deploying" means: put `dist/` on a host, point it at a domain, done.
No server to run.

Recommended host: **Vercel** (free, git-connected, zero config for Vite).

---

## 0. Before anything: check the build

`npm run dev` and `npm run build` are different code paths. Run both.

```bash
npm run build
npm run preview     # serves dist/ at http://localhost:4173
```

Click through `/`, `/teacher`, `/teacher/sweep`, a child profile, `/stickers`.
If `preview` works, the deploy will work. If it fails here, fix it here — it is
much faster to debug locally than on Vercel.

---

## 1. Put the code on GitHub

The project isn't a git repo yet.

```bash
cd D:\arnav\projects\kidchemy
git init
git add .
git commit -m "Kidchemy: initial commit"
```

`.gitignore` already excludes `node_modules`, `dist`, and `.env`, so nothing
heavy or secret goes up.

Then create an **empty** repo on github.com (no README, no .gitignore — you
already have both), and:

```bash
git branch -M main
git remote add origin https://github.com/<you>/kidchemy.git
git push -u origin main
```

---

## 2. Deploy on Vercel

1. Go to vercel.com, sign in with GitHub.
2. **Add New → Project**, pick the `kidchemy` repo.
3. Vercel detects Vite automatically. Framework: Vite. Build: `npm run build`.
   Output directory: `dist`. Leave the defaults alone.
4. Click **Deploy**. About a minute.

You get a URL like `kidchemy.vercel.app`. That's it — it's live.

### Environment variables (optional)

`src/data/supabase.js` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
if they exist, and falls back to the pilot project if they don't. So the deploy
works with no env vars set. If you later want a separate Supabase project for
production, add those two in Vercel → Settings → Environment Variables and
redeploy.

Note: anything prefixed `VITE_` is **compiled into the JavaScript bundle** and
is visible to anyone who opens devtools. That's fine for the Supabase
publishable key (it's designed to be public), but never put a service-role key
or any real secret behind a `VITE_` name.

---

## 3. Why `vercel.json` matters

This app uses client-side routing. Without config, a visitor who lands directly
on `/profile/s3` — which is exactly what a QR code does — gets a 404, because
there is no file at that path on the server.

`vercel.json` rewrites every path to `index.html` so React Router can handle it.
Don't delete it.

If you deploy to Netlify instead of Vercel, `public/_redirects` does the same
job there. Both files are harmless on the other host.

---

## 4. QR codes

`ReportCardSticker.jsx` builds QR links from `window.location.origin`, so once
you're on a real domain the stickers point at that domain automatically. Nothing
to change.

But: **stickers printed from localhost are dead paper.** Regenerate them from
the deployed URL before printing anything for a school.

---

## 5. Making changes after deploying

This is the whole loop:

```bash
# 1. edit code locally, check it
npm run dev

# 2. commit
git add .
git commit -m "what changed"

# 3. push
git push
```

Vercel watches the `main` branch. Pushing triggers a rebuild and the live site
updates in ~1 minute. There is no separate "deploy" step ever again.

Two useful habits:

- **Branch for anything risky.** `git checkout -b sweep-redesign`, push it, and
  Vercel builds a *preview* URL for that branch without touching production.
  Merge to `main` when you're happy.
- **Rollback is instant.** Vercel → Deployments → pick the last good one →
  Promote to Production. Useful when a demo is in 20 minutes.

### Changes to the database

Schema changes do *not* go through git. Editing `supabase/schema.sql` locally
changes nothing on the live database. Run the SQL in the Supabase dashboard's
SQL editor, then update `schema.sql` in the repo so the file stays truthful.

---

## 6. Known limitation (read before showing anyone real data)

`supabase/schema.sql` grants the anonymous role full read *and* write on every
table:

```sql
create policy "anon full access" on observations
  for all using (true) with check (true);
```

Consequences on a public URL:

- Anyone with the link can open `/teacher` and log or edit observations.
- The `school`-only visibility flag is enforced in React, not in the database.
  Someone querying the Supabase API directly can read teacher-only notes.
- Child names and observations are readable by anyone who finds the URL.

For a demo with the seeded fake students (Class 6A, Vidya Vihar), this is fine —
that's what it was built for. Before a real school and real children go in, it
needs Supabase Auth plus policies that scope rows to the signed-in teacher's
school, and a server-side filter for `shared` vs `school`.

---

## Quick reference

| Task | Command |
|---|---|
| Run locally | `npm run dev` |
| Test the production build | `npm run build && npm run preview` |
| Ship a change | `git add . && git commit -m "..." && git push` |
| Preview a risky change | `git checkout -b name` then push |
| Roll back | Vercel → Deployments → Promote to Production |
| Change the schema | Supabase dashboard SQL editor, then update `schema.sql` |
