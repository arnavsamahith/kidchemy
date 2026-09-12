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
If `preview` works, the deploy will work. If it fails here, fix it here. It is
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

Then create an **empty** repo on github.com (no README, no .gitignore, you
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

You get a URL like `kidchemy.vercel.app`. That's it, it's live.

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
on `/profile/s3`, which is exactly what a QR code does, gets a 404, because
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

For a demo with the seeded fake students (Class 6A, Vidya Vihar), this is fine, that's what it was built for. Before a real school and real children go in, it
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

---

## v2, auth, roles and RLS

v2 adds real accounts. Two things must happen in Supabase before the new build
works, and they are both one-time.

### 1. Run the new schema

Open the Supabase SQL editor and run the whole of `supabase/schema.sql`. It is
idempotent, safe to run on the existing project. It will:

- add `profiles`, `teacher_codes` and `parent_links`
- add `students.access_code` and `observations.tag_notes`
- install a trigger on `auth.users` that creates the profile at signup
- **drop the v1 "anon full access" policies** and replace them with real ones
- trim the pilot class to Aryan and Priya

After it runs, an unauthenticated visitor can read nothing. That is the point.
If the app suddenly shows an empty class, check that you are signed in, an
empty result is what a correct policy looks like to the wrong user.

### 2. Decide about email confirmation

Supabase → Authentication → Providers → Email.

- **Confirm email ON** (the default): signup sends a link, and the person must
  click it before they can sign in. The login page already tells them this.
  Set the Site URL and Redirect URLs to your Vercel domain or the link will
  point at `localhost`.
- **Confirm email OFF**: signup logs the person straight in. Much better for a
  pilot demo where you are creating accounts in front of a headteacher.

### 3. Codes

- Teacher signup requires a code from `teacher_codes`. The pilot row is
  `VIDYA-6A`. Add a row per school or per class as you onboard them:
  ```sql
  insert into teacher_codes (code, school, class_name)
  values ('STMARY-7B', "St Mary's High School", 'Class 7B');
  ```
- Parent signup takes the child's `students.access_code`. The pilot codes are
  `ARYAN-4821` and `PRIYA-7136`, and both are printed on the sticker sheet at
  `/teacher/stickers`. Anyone holding a code can claim that child, so treat the
  sticker sheet as confidential until it is glued to the right report card.

### 4. Smoke test after deploying

1. Sign out. Visit `/teacher`, you should land on `/login`.
2. Create a teacher account with `VIDYA-6A`. You should see both children.
3. Log an observation with a remark under a tag. Check it appears in the child's
   timeline and in the remark ledger on `/teacher/analytics`.
4. Mark an observation "school only". Sign out.
5. Create a parent account with `ARYAN-4821`. You should see Aryan and only
   Aryan, and the school-only entry should be absent from the profile.

---

## v3, the current schema

`supabase/schema.sql` is idempotent. Paste the whole file into the Supabase SQL
editor and run it. On an existing v2 project it migrates in place.

What v3 changes:

- `students` gains `student_code`, `grade`, `section`, `roll_no` and
  `archived`, matching the roster CSV a school actually exports.
- A third role, `admin`. `profiles.role` gains it, `kc_is_teacher()` now
  admits admins, and `kc_set_role()` lets an admin promote others.
- `observations` gains the Learning Story fields (`story` jsonb),
  `dispositions`, `concentration_minutes`, `self_chosen` and `artefact_url`.
- New tables: `self_assessments`, `peer_assessments`, `parent_notes`,
  `app_settings`, `audit_log`.
- Clean slate on the demo roster: the v2 seed students are removed and the
  Grade 7C roster from `dump/` is imported with fresh access codes.

### Making the first superadmin

`kc_set_role()` requires an existing admin, so the first one is made by hand.
Sign up in the app with any role first, then in the SQL editor:

```sql
update public.profiles set role = 'admin'
 where id = (select id from auth.users where lower(email) = lower('you@example.com'));
```

Confirm it took:

```sql
select role from public.profiles
 where id = (select id from auth.users where lower(email) = lower('you@example.com'));
```

If no row updates, that account has not signed up yet.

### After running v3

1. Sign in as a teacher and check `/teacher/roster` shows ten children in
   Grade 7C.
2. Run a class sweep. Confirm every child you tapped now has an observation.
3. Open `/teacher/ptm` and print. The sheets should have content for the
   children you swept and say so honestly for the ones you did not.
4. Sign in as the admin and open `/admin`. If the console reports that admin
   data could not be loaded, the role did not take.

### Teacher codes

The v3 seed mints `VIDYA-7C` for Grade 7C. Mint more from `/admin/people`.
A teacher cannot create an account without one, which is the difference between
a login page and a login page anyone can walk through.
