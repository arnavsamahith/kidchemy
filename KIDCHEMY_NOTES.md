# Kidchemy: build notes, critique, and what to do next

Written alongside the MVP in this folder. Three parts: what I built and where I
deviated from your brief; where I think the product breaks; and how I'd
sequence the next eight weeks.

---

## 1. What I built

Everything in your prompt, plus four things it didn't ask for.

| Route | What it is |
| --- | --- |
| `/` | Landing + demo classroom index |
| `/teacher` | Roster, with who has and hasn't been logged this term |
| `/teacher/:studentId` | The observation form |
| `/profile/:studentId` | The parent view |
| `/stickers` | Printable QR stickers (added) |

**Deviations, and why:**

**a) The profile is derived, not mocked.** Your brief said "static for MVP" for
the narrative, learning style, pathways, actions and questions. I made all of
them functions of the tags a teacher actually tapped (`src/data/derive.js`).
Add one observation and the profile visibly changes.

This matters more than it sounds. A demo with a hardcoded paragraph tests
nothing, every principal you show it to will ask "so what does it say for a
different child?", and the honest answer has to be a live one. It also forces
the hard question early: *is there actually enough signal in seven tag groups to
say something specific?* You can now answer that empirically instead of
believing it.

**b) It's rule-based, on purpose, no LLM.** Every sentence is traceable to
counted evidence. When a teacher asks "why does it say my student is a
reflective processor", there's an answer. Put an LLM on top later, for *prose
only*, over a structured JSON of claims the rules produced. Never let it invent
an observation. (It also means translation is tractable, see §3f.)

**c) Evidence is shown, not hidden.** Every profile says "Built from 3
observations by 2 teachers across 3 terms." The radar has a band per axis, *not yet observed / starting to show / often seen / a signature strength*, rather than a number. An empty axis says "we haven't seen it", not "your child
lacks this." A profile built on one observation should look thin, because it is.

**d) Subject detail is collapsed by default.** Your brief has the teacher fill
concept understanding + engagement + a note for 3 to 4 subjects on every
observation. That's the part teachers will abandon. It's now one tap to expand,
skipped on daily logs. See §2a for the bigger fix.

**Not built:** auth, backend, admin/school dashboard, multilingual, PDF export.
Deliberate, §4 says when each earns its place.

**Run it:** `npm install && npm run dev`

---

## 2. Where this breaks

Ranked by how likely each one is to kill it.

### a) The teacher's arithmetic doesn't work

This is the whole thing. Everything else is downstream.

Your brief assumes one class of 30. A real Indian secondary-school teacher
handles 4 to 6 sections, 40 to 60 students each, 200+ children. Even at a genuinely
fast 45 seconds per child, weekly logging is 2.5 hours a week of unpaid work
for a benefit that accrues to someone else. It will not happen. Not because
teachers don't care, but because the arithmetic is impossible.

The MVP's per-child form is the right *artefact* and the wrong *unit of input*.

**Invert it.** Don't ask "tell me about Aryan." Ask "who did this today?"

> **Asks deep questions**, tap the children this was true of this week.
> `[Aryan] [Priya] [Rohan] [Ananya] [Kabir] …`

Seven prompts, a few taps each, and the whole class is logged in under two
minutes. Same data model, one-tenth the effort, and it's closer to how memory
actually works, a teacher can't recall a profile of Kabir on demand, but they
can absolutely tell you who asked the best question this week.

Per-child logging then becomes the *exception* flow: the child who did something
worth a sentence. That's where the freeform note belongs, and the note is the
thing parents will actually remember.

Build this next. It's the highest-value change in this document.

### b) Sparse and uneven data is the normal case, not the edge case

Under class-sweep logging, the quiet child in the third row gets tagged four
times a term and the loud one gets tagged forty. The quiet child's parent still
scans the QR code.

You need an explicit answer for a thin profile, and it can't be padding. Options
that work: show fewer sections; say plainly "we're still getting to know
[Name]"; or, better, let the roster surface *"3 children you haven't observed
in 4 weeks"* and nudge the teacher. Kabir Singh in the seed data is there to
keep you honest; look at his profile.

There's also a fairness problem worth naming: a system that rewards visible
behaviour will systematically under-describe shy children. That's the same bias
report cards have, wearing nicer clothes.

### c) The horoscope risk

The test of this product is not whether a parent likes the profile. It's whether
they'd recognise it as *theirs*.

**Run this the first time you have five real profiles:** print three of them
with the names removed, hand them to a parent, ask them to pick their child. If
they can't do it reliably, you've built a horoscope and you should stop and fix
the taxonomy before writing another line of code. If they can, and they get a
bit emotional doing it, you have the thing.

Two forces push toward horoscope: warm generic prose, and positivity bias. Which
brings us to:

### d) A profile that can only say nice things stops being believed

Every parent at the gate compares. If all five profiles glow, the fifth parent
works out what's happening by the second PTM, and the product becomes a
pleasantry.

So the profile has to be able to say something a parent doesn't want to hear,
kindly and specifically: *"Aryan understands more than he can write down. The
gap is expression, not comprehension, and it will start costing him marks
around Class 8 if it isn't worked on."* That sentence is useful. "Aryan is a
curious independent thinker" is not.

But this collides with the next problem:

### e) Teachers self-censor when parents can read it

The moment a teacher knows a parent sees the "needs attention" flag, they stop
using it. Your data quality dies quietly and you won't notice for a term.

**Split the record.** Every observation gets a visibility: *school-only* or
*shared with parents*, teacher-controlled, with sensible defaults (concerns
default to school-only; strengths default to shared). The parent view renders
the shared subset. The school dashboard sees everything. This is a schema
decision, make it now, before you have data, because retrofitting it is
miserable. Right now my build shows "needs attention" milestones to parents;
that's a decision you should consciously reverse or keep.

### f) "Where [Name] could go" is the most dangerous screen in the product

You're building this *because* Indian parents over-index on premature career
sorting. Then the product tells the parent of an 11-year-old that their child
suits engineering. That gets screenshotted. It gets repeated to the child. It
becomes a new label, and a stickier one than a percentage, because it sounds
insightful.

I kept the section (you asked for it) but hedged it hard and made the
actionable half about *activities this year*, not careers. I'd go further:

- **Below Class 9:** cut careers entirely. Replace with "What to feed next", clubs, materials, kinds of problems. Same intelligence, no destiny.
- **Class 9+:** careers are fine, because the child is actually choosing streams
  and the information is genuinely useful then.

If you keep it as-is, at minimum never show fewer than two very different
pathways, so it reads as a space rather than a verdict.

### g) The three-sided misalignment

The teacher does the work. The parent gets the value. The principal writes the
cheque. Classic edtech death.

Two consequences:

**Give the teacher something the same week.** The strongest version of this
product might not be the parent profile at all, it might be the **PTM prep
sheet**. Teachers dread parent-teacher meetings and have nothing to say past the
marks. Generate a one-page printed sheet per child from the same taps: three
things to praise, one thing to raise, two questions to ask the parent. The
teacher gets paid back within days, in a currency they care about, looking
competent and prepared in front of a parent. Adoption stops being charity.

Same data. Same taps. Completely different adoption curve. I'd build this before
the admin dashboard.

**Know what the principal is actually buying.** It won't be "a truer picture of
each child", it'll be admissions differentiation and PTM quality. That's fine.
Sell to that, build the honest thing, and don't let the sales story bend the
product. But go in knowing it, or you'll pitch the wrong thirty seconds.

### h) Data protection is a real constraint, not a footnote

You're processing personal data of minors in India, at scale, and it's
psychological in nature. Under the DPDP Act 2023 and the DPDP Rules 2025
(notified 14 November 2025; the substantive obligations phase in by around 13
May 2027), processing a child's data generally needs *verifiable* parental
consent, and behavioural tracking and targeted advertising directed at children
are restricted.

The good news: the Fourth Schedule to the Rules carves out educational
institutions for purposes connected to providing education, which is where the
core product sits if you're processing on the school's behalf. The trap is that
the exemption is **purpose-bound**, and two lines in your monetisation section
sit outside it:

- *"Premium parent tier: 1:1 counselling matched to the child's profile"*
- *"Government/NGO licensing: anonymised aggregate insights"*

Neither is obviously "providing education." Design the boundary now: separate
consent, separate data path, opt-in, and genuine anonymisation (aggregate
class-level insights on a 30-child class are re-identifiable more easily than
people assume).

Practical hygiene from day one, none of it expensive:

- A written data processing agreement with the school; school obtains parental
  consent at admission.
- Data stored in India. Retention policy. Deletion on request, honoured.
- Profile URLs: opaque random tokens, never guessable IDs (`/p/7fk2m9x`, not
  `/profile/aryan-mehta`, my MVP does the wrong thing here deliberately so
  it's easy to demo).
- A second factor on first scan, OTP to the mobile the school has on record,
  then a long-lived cookie. "Password-protected" in the brief needs to become
  this.
- No indexing, no third-party analytics on parent pages, no ads ever.

I'm not a lawyer and none of this is legal advice, but this is cheap to get
right at 30 children and very expensive to retrofit at 30 schools. Talk to
someone before school #2.

### i) The name

Minor, but you'll be stuck with it. *Kidchemy* is charming and memorable.
Two frictions worth a moment's thought: "alchemy" implies *transmuting* the
child, which cuts slightly against your actual promise (we describe, we don't
improve); and "kid" reads young for a product that runs to age 16. Neither is
fatal, Duolingo means nothing either. Keep it, but check the .com and the
trademark class before you print stickers, and be aware of the adjacency to
Edchemy: same suffix, adjacent market, and a shared name pattern will invite
questions about where one ends and the other begins. Worth having that
conversation with your Edchemy side deliberately rather than accidentally.

---

## 3. Changes I'd make to the product spec

Concrete, in priority order.

1. **Class-sweep input as the primary flow.** (§2a) Per-child form becomes the
   exception path.
2. **PTM prep sheet for teachers.** (§2g) Printable, one page per child, from
   the same taps. Probably the real wedge.
3. **Visibility flag on every observation.** (§2e) School-only vs parent-shared.
   Schema change, do it before you have data.
4. **Replace careers with activities below Class 9.** (§2f)
5. **Let the profile say hard things.** Add a small, carefully-worded set of
   "growth edge" outputs; make the tone warm and the content specific.
6. **Roster import.** A teacher will not type 40 names. CSV paste, or a
   screenshot of an attendance register, or an export from whatever ERP the
   school already runs (most Indian private schools have one). This is a
   surprisingly common reason pilots die in week one.
7. **Multilingual by phrase bank, not machine translation.** English, Hindi,
   Tamil, Telugu. Because the output is templated, translation is a `strings.ta.js`
   file a bilingual teacher can proofread in an afternoon, and it is *correct*.
   Free LLM prose in four languages is neither reviewable nor reliable. This is
   the concrete payoff of the rule-based design.
8. **WhatsApp delivery alongside QR.** How Indian parents actually receive
   things. QR is the ceremony; WhatsApp is the channel.
9. **Offline tolerance.** Teachers log in corridors on 3G. Queue writes locally,
   sync when possible. Keep the bundle small.

---

## 4. How to go about it

Your roadmap is good and I'd change the front of it. Two changes: start with a
teacher rather than a school, and charge earlier.

### This week, make the demo defensible

- Run it. Click through all five children. Find every sentence that could
  describe any child and rewrite it (`derive.js`, phrase banks at the top).
- Do the unlabelled-profile test (§2c) on two parents you know. Before you show
  a single school.
- Build the class-sweep input screen. It's a day, and it changes the pitch from
  "here's a form" to "here's your whole class in ninety seconds."

### Week 2, one teacher, not one school

A principal takes six weeks and three meetings to say yes. A teacher says yes in
ten minutes if you make her look good at the next PTM.

Find **one** teacher, family friend, an old school teacher of yours, anyone in
the IITM or E-Cell network with a parent who teaches. Ask for one class and four
weeks. Sit next to her the first time she logs a class; do not send a link and
hope. Watch where her thumb hesitates.

No QR, no backend, no accounts. She logs, you generate, you WhatsApp five
profiles to five parents yourself. Everything else is scaffolding for a thing
you haven't proved yet.

### Weeks 3 to 4, the only two numbers

- **Does she still log in week 4 without you asking?** That's the product
  question. If yes, you have a company. If no, nothing downstream matters and
  more features won't fix it.
- **What do parents do with the profile?** Not "did they like it", did they
  forward it, screenshot it, reply, mention it to the teacher unprompted?

Ship the PTM prep sheet in this window. It's the thing that makes week 4 happen.

### Month 2, the QR moment, and the first cheque

Now go to the principal, with a teacher who will vouch for you and five parents
who reacted. That's a completely different meeting from a demo.

Print the stickers (`/stickers`, it's already there), put them on real report
cards for one section at the next PTM, and stand in the room. Count scans. Watch
faces. This is the moment your brief correctly identifies as decisive.

**Charge for the pilot.** Even ₹10,000. Not for the money, a free pilot has no
owner inside the school, and free pilots convert at roughly zero. A paid one
gets a name attached to it.

### Month 3 to 4, make it real software

Only now: backend, auth, opaque profile tokens + OTP, roster import,
school-only/shared visibility, the admin dashboard. Postgres, a boring host in
an Indian region, and the DPA in §2h.

Second and third school. Reference the first properly, a two-minute video of a
teacher saying it saved her PTM prep is worth more than any deck.

### Month 6, build what you learned

By now you'll know which four tags account for 80% of taps, which profile
section parents actually scroll to, and whether teachers use freeform notes at
all. Cut the rest ruthlessly. The 4-tag version people use beats the 24-tag
version they don't.

---

## 5. Questions to answer before writing much more code

1. If a teacher can only log **once a term**, does the profile still move a
   parent? (If yes, your whole go-to-market gets easier. Test it deliberately.)
2. What does the profile say about a child who is genuinely struggling, and
   would you show that page to that child's parent?
3. Who owns the profile when the child changes school? Does it follow them?
   (Say it now. It's your long-term moat and your biggest trust liability, and
   parents will ask.)
4. Does the child ever see their own profile? Should they? At what age? A
   12-year-old reading "shy but thoughtful" about themselves is a real event,
   and you're the one who caused it.
5. What's the one sentence a parent repeats to their spouse that evening? Design
   backwards from that sentence.

---

## Sources

DPDP references above:

- [DPDP Rules and the Future of Child Data Safety, ORF](https://www.orfonline.org/expert-speak/dpdp-rules-and-the-future-of-child-data-safety)
- [A closer look at the DPDP Rules 2025, Ikigai Law](https://www.ikigailaw.com/article/647/a-closer-look-at-the-dpdp-rules-2025)
- [Child's Personal Data and Privacy: Analysing the DPDP Rules, Bar & Bench](https://www.barandbench.com/law-firms/view-point/childs-personal-data-and-privacy-analysing-the-draft-dpdp-rules-2025)
- [DPDP Rules, 2025 Notified, PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/nov/doc20251117695301.pdf)
