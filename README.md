# Kidchemy

A living child profile platform. Teachers log lightweight observations; parents
get a warm, human portrait of their child — reached by scanning a QR sticker on
the physical report card. It augments the report card. It replaces nothing.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Build: `npm run build` · Preview the build: `npm run preview`

**Before the first run against a fresh Supabase project**, paste
`supabase/schema.sql` into the Supabase SQL editor and run it. It creates the
tables, the auth trigger, the row-level security policies and the pilot data.
Running it again is safe.

## Two doors

Kidchemy has two separate apps behind one URL, gated by a role stored on the
user's profile row.

| | Teacher | Parent |
| --- | --- | --- |
| Signs up with | a **school code** (`VIDYA-6A` in the pilot) | their **child's access code** (e.g. `ARYAN-4821`) |
| Can see | the whole class, including school-only observations | one profile per linked child, shared observations only |
| Can write | observations, remarks, roster changes | nothing |

Row-level security enforces this in Postgres, not in the browser — a parent's
session physically cannot read another child's rows.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Public landing page |
| `/login` | Sign in / sign up, role-switched |
| `/teacher` | Overview: coverage, the class, evidence heatmap, blind spots |
| `/teacher/roster` | Sortable, searchable table; add a child; parent codes |
| `/teacher/analytics` | Growth, tag frequency, cadence, milestones, remark ledger |
| `/teacher/sweep` | Class sweep — whole class in two minutes |
| `/teacher/stickers` | Printable QR + code stickers |
| `/teacher/student/:id` | One child's file: strengths, subjects, full timeline |
| `/teacher/student/:id/observe` | The observation form |
| `/teacher/student/:id/observe/:obsId` | The same form, editing an entry |
| `/parent` | A parent's children |
| `/profile/:id` | The parent view — this is the product |

## How it's put together

```
src/
  data/
    taxonomy.js   the vocabulary — every tag and the dimensions it feeds
    derive.js     synthesis — tags in, portrait out (narrative, radar, pathways)
    analytics.js  class-level analysis — heatmap, growth, frequency, filters
    seed.js       reference copy of the pilot classroom (DB is the real source)
    supabase.js   client, queries, auth calls
    auth.jsx      session + profile + role
    store.jsx     React context over Supabase, scoped by the signed-in user
  components/     AppShell, RequireRole, charts, Chip, StrengthMap, Ornament
  pages/
    Landing, Login, ObservationForm, ClassSweep, ParentProfile
    teacher/      Overview, Roster, Analytics, StudentDetail, Stickers
    parent/       ParentHome
```

The important file is still **`src/data/derive.js`**. Everything a parent reads
is derived deterministically from the tags a teacher tapped — the narrative, the
strength map, the pathways, the parent actions, the questions. Nothing is
hardcoded per child, so adding one observation visibly changes the profile.

That determinism is deliberate. When a teacher asks *"why does it say that
about my student?"*, there is always an answer.

### Custom remarks

Every tag a teacher taps opens its own remark box. Those remarks are stored as
`observations.tag_notes` (a `jsonb` map of `tagId → text`), and they are the one
part of the profile written in the teacher's own words rather than derived.
They appear in three places: the child's timeline, the class remark ledger on
`/teacher/analytics`, and — when the observation is shared — the parent profile
under *"In your teacher's words"*.

### Charts

`src/components/charts.jsx`. The series colours in `index.css`
(`--color-series-*`) are a validated categorical palette: every adjacent pair
clears ΔE ≥ 12 under protanopia, deuteranopia and tritanopia on the paper
surface. The UI moss/clay are too low-chroma and too close on the red–green
axis to carry data, which is why charts use a separate set.

### Tuning it

- A tag reads wrong to a pilot teacher → edit its `dims` weights in `taxonomy.js`.
- The profile feels generic → edit the phrase banks at the top of `derive.js`.
- Scores feel too generous / too stingy → change `K` in `derive.js`
  (higher = more evidence needed before a dimension reads as established).
- A new school joins → insert a row into `teacher_codes`.

### Persistence

Supabase Postgres. There is no localStorage cache any more — a shared staffroom
laptop must not keep one teacher's class around for the next person who signs in.

## Stack

React 19 · Vite · React Router · Tailwind v4 · Supabase (Postgres + Auth) ·
lucide-react · qrcode

## Not built yet

Multi-class and school-admin views, invitations by email, multilingual output,
PDF export, LLM prose. See `KIDCHEMY_NOTES.md` for the order to build them in
and why.
