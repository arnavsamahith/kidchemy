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

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing + demo classroom index |
| `/teacher` | Class roster, who's been logged this term |
| `/teacher/:studentId` | The observation form (the 45-second flow) |
| `/profile/:studentId` | The parent view — this is the product |
| `/stickers` | Printable QR stickers for report cards |

## How it's put together

```
src/
  data/
    taxonomy.js   the vocabulary — every tag and the dimensions it feeds
    derive.js     synthesis — tags in, portrait out (narrative, radar, pathways)
    seed.js       one classroom, five children, three terms
    store.jsx     React context over localStorage
  components/     Chip, StrengthMap (radar), Ornament (SVG decoration)
  pages/          Landing, TeacherDashboard, ObservationForm, ParentProfile,
                  ReportCardSticker
```

The important file is **`src/data/derive.js`**. Everything a parent reads is
derived deterministically from the tags a teacher tapped — the narrative, the
strength map, the pathways, the parent actions, the questions. Nothing is
hardcoded per child, so adding one observation visibly changes the profile.

That determinism is deliberate. When a teacher asks *"why does it say that
about my student?"*, there is always an answer. Later, an LLM can rewrite the
**prose** for warmth and language — but the underlying claims should keep coming
from counted evidence, not from a model's imagination.

### Tuning it

- A tag reads wrong to a pilot teacher → edit its `dims` weights in `taxonomy.js`.
- The profile feels generic → edit the phrase banks at the top of `derive.js`.
- Scores feel too generous / too stingy → change `K` in `derive.js`
  (higher = more evidence needed before a dimension reads as established).

### Persistence

`localStorage` under the key `kidchemy.v1`, seeded on first load. Clear site
data to reset, or call `reset()` from the store.

## Stack

React 19 · Vite · React Router · Tailwind v4 · lucide-react · qrcode

## Not built yet

Auth, a real backend, multi-teacher accounts, the admin/school dashboard,
multilingual output, PDF export, LLM prose. See `KIDCHEMY_NOTES.md` for the
order to build them in and why.
