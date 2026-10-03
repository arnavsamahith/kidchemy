# Kidchemy

A living child profile platform. Teachers record what they already notice.
Parents get a real picture of their child instead of a percentage.

Kidchemy sits on top of the existing report card rather than replacing it: a QR
sticker on the physical card the school already sends home.

```bash
npm install
npm run dev
```

---

## What is here

| Route | Who | What |
| --- | --- | --- |
| `/` | anyone | Landing page |
| `/login` | anyone | Sign in and sign up. Teachers need a school code. |
| `/teacher` | teacher | Today: coverage, fairness, who has not been seen |
| `/teacher/sweep` | teacher | Class sweep, the primary input flow |
| `/teacher/roster` | teacher | Roster, CSV import, profile depth per child |
| `/teacher/student/:id` | teacher | One child: picture, next steps, progress card, timeline |
| `/teacher/student/:id/observe` | teacher | The observation form |
| `/teacher/analytics` | teacher | Patterns, fairness, your own remarks |
| `/teacher/ptm` | teacher | Printable parent meeting sheets |
| `/teacher/stickers` | teacher | Printable QR stickers |
| `/parent` | parent | Your children |
| `/profile/:id` | parent, teacher | The profile the family reads |
| `/admin` | superadmin | Console, coverage and health across classes |
| `/admin/people` | superadmin | Accounts, roles, school codes |
| `/admin/config` | superadmin | Policy switches, terms, vocabulary reference |
| `/admin/audit` | superadmin | Audit trail |

---

## The two flows that matter

**Class sweep** is the input. It asks "who did this this week" one prompt at a
time and lets the teacher tap every child it was true of. The whole class in
about ninety seconds. The per-child form is the exception path, for the child
who did something worth a sentence.

This inversion is the difference between a product a teacher uses and a product
a teacher abandons. A real Indian secondary teacher handles four to six
sections of forty to sixty children. Per-child logging at forty-five seconds
each is two and a half hours a week of unpaid work for a benefit that accrues
to someone else.

**Parent meeting sheets** are the payback. Three things to praise with the
evidence attached, one thing to raise, two questions to ask, generated from
taps the teacher already made. Teachers dread parent meetings and have nothing
to say past the marks. This is what makes week four happen.

---

## What the profile is built from

Everything is deterministic and rule-based. No model writes a claim about a
child. Every sentence traces to a counted observation, so when a teacher asks
why the profile says something, there is an answer.

- `src/data/taxonomy.js` is the vocabulary: the tags a teacher can tap, what
  each weighs into, and which of the five NEP 2020 domains it rolls up to.
- `src/data/pedagogy.js` is the philosophy layer: frameworks, dispositions, the
  learning-story structure, the fixed-trait language guard, the ZPD ladders.
- `src/data/derive.js` turns taps into a portrait.
- `src/data/analytics.js` does the same at class level, including the fairness
  measures.

`docs/PEDAGOGY.md` explains which claims about children this product makes,
where each comes from, and which popular ideas it deliberately refuses.
`docs/ROLLOUT.md` is how to get it into schools. `docs/BRAND.md` is the mark,
the palette and the type, including why the chart colours are what they are.

---

## Four decisions that keep it honest

**It measures its own bias.** A record built on visible behaviour
under-describes quiet children. The Fairness tab shows exactly how unevenly
attention is landing and who has not been seen in a month.

**Teachers can withhold.** Every observation is shared or school-only. A
teacher who knows a parent reads every concern stops recording concerns, and
the data dies quietly. Growth-edge tags default to school-only.

**No careers below Class 9.** A career suggested to an eleven-year-old becomes
a label stickier than a percentage, because it sounds insightful. Below the
threshold, parents see what to feed the interest instead. A superadmin can move
the threshold in `/admin/config`.

**No learning styles.** The visual, auditory, kinesthetic meshing hypothesis is
not supported by evidence. The profile says "here are the specific conditions
in which we have watched this child do good work, and how often", which is a
different and defensible claim.

---

## Database

Supabase, with row-level security doing the scoping. Paste
`supabase/schema.sql` into the SQL editor, **then `supabase/security.sql`**.
Both are safe to re-run, always in that order. Security, DPDP and
child-safety notes, and the pre-launch checklist, are in `docs/SECURITY.md`.

Three roles:

- **parent** sees only their linked children, and only shared observations.
- **teacher** sees their school. Cannot self-register without a school code.
- **admin** sees everything and can change configuration.

The first superadmin has to be made by hand, because promoting to admin
requires an existing admin. The two lines to run are at the bottom of
`supabase/schema.sql`.

Config comes from environment variables when present and falls back to the
pilot project so `npm run dev` works with no setup. See `.env.example`.

---

## Roster import

`dump/kidchemy - Student data.csv` is the canonical shape:

```
Student Name,Student ID,Current Grade,Current Section,Current Roll Number
Aarav Sharma,2019M01,7,C,1
```

Headers are matched loosely, so most school ERP exports work unchanged. Import
from `/teacher/roster`. Access codes are generated fresh and carry no part of
the child's name, so a photographed sticker does not reveal whose it is.
