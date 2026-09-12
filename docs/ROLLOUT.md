# Getting Kidchemy into actual classrooms

The product is not the hard part. This is.

Everything below assumes the honest version of the three-sided problem: the
teacher does the work, the parent gets the value, and the principal writes the
cheque. Every edtech product that dies, dies there. The sequencing exists to
get the teacher paid back before anyone asks her for anything.

---

## Phase 0: before you talk to a single school

**Do the unlabelled profile test.** This is the one that tells you whether you
have a product or a horoscope, and it costs an afternoon.

Take five real profiles. Remove the names. Hand them to a parent of one of
those five children and ask them to pick theirs. If parents cannot reliably do
this, the profile is generic and no amount of design will save it. Fix the
taxonomy before writing another line of code.

Do it again at 30 children, and again at 200. The failure mode arrives with
scale, not at the start.

**Decide two things in writing:**

1. Who owns a profile when the child changes school. Parents will ask, and the
   answer is both your long-term moat and your biggest trust liability.
2. Whether the child ever sees their own profile, and at what age. A
   twelve-year-old reading "quiet, and worth waiting for" about themselves is a
   real event and you are the one who caused it.

---

## Phase 1: one teacher, four weeks. Not one school.

A principal takes six weeks and three meetings to say yes. A teacher says yes
in ten minutes if you make her look good at the next parent meeting.

**Find one teacher.** A family friend, an old teacher of yours, anyone in your
network with a parent who teaches. Ask for one section and four weeks.

**Set her up yourself, in person.**

1. Import her roster from whatever the school already exports. Two minutes.
   If she has to type forty names, the pilot is already over.
2. Sit next to her for the first class sweep. Do not send a link and hope.
   Watch where her thumb hesitates. That hesitation is your roadmap.
3. Print her parent meeting sheets at the end of week one, before she has
   asked for anything. This is the moment the product stops being a favour
   she is doing you.

**No QR codes, no accounts for parents, no backend ceremony.** She logs, you
generate, and you send five profiles to five parents yourself over WhatsApp.
Everything else is scaffolding for a thing you have not proved yet.

### The only two numbers that matter in phase 1

**Does she still log in week four without you asking?**
That is the product question. If yes, you have a company. If no, nothing
downstream matters and more features will not fix it.

**What do parents actually do with the profile?**
Not "did they like it". Did they forward it, screenshot it, reply to it, or
mention it to the teacher unprompted? Liking is polite. Forwarding is real.

### What to watch for, week by week

| Week | The failure it exposes |
| --- | --- |
| 1 | The input flow is too slow. Cut prompts until the sweep is under two minutes. |
| 2 | She logs the same six visible children every time. Check the Fairness tab with her. |
| 3 | Everything is marked school-only. She does not trust the sharing model yet. Find out why. |
| 4 | She stops. Find out whether it was time, doubt about value, or the term getting busy. |

---

## Phase 2: the parent meeting, and the first cheque

Now go to the principal, with a teacher who will vouch for you and five parents
who reacted. That is a completely different meeting from a demo.

**What the principal is actually buying.** It will not be "a truer picture of
every child". It will be one of three things, and you should know which before
you walk in:

1. **Holistic Progress Card compliance.** NEP 2020 and the NCF 2023 point
   schools at a five-domain, multi-stakeholder progress card. Most schools are
   dreading it, because it is a large amount of qualitative writing per child
   per term with no tooling. Kidchemy assembles it from taps a teacher already
   made. This is the strongest opening line you have in India right now.
2. **Admissions differentiation.** A school that can show prospective parents
   a real profile of a child has something the school down the road does not.
3. **Parent meeting quality.** Principals hear complaints about parent
   meetings. A teacher walking in with a prepared one-pager fixes that.

Sell to those. Build the honest thing underneath. Do not let the sales story
bend the product.

**Print the stickers and stand in the room.** Put them on real report cards for
one section at the next parent meeting and watch parents scan them in front of
you. Count the scans. Watch the faces. This is the decisive moment and there is
no substitute for being present for it.

**Charge for the pilot.** Even a token amount. Not for the money: a free pilot
has no owner inside the school, and free pilots convert at approximately zero.
A paid one gets a name attached to it and a person who has to justify it.

---

## Phase 3: the second and third school

Only now does it become software rather than a demo.

**What has to be real before school two:**

- Opaque profile tokens rather than guessable ids in the URL.
- A second factor on the first scan: an OTP to the mobile number the school
  already holds, then a long-lived cookie. "Password protected" is not enough
  when the thing being protected is a psychological profile of a child.
- A written data processing agreement with the school, with the school
  obtaining parental consent at admission.
- Data stored in India. A retention policy. Deletion on request, honoured.
- No indexing, no third-party analytics on parent pages, no advertising, ever.

**On the DPDP Act 2023 and the DPDP Rules 2025.** You are processing personal
data of minors, at scale, and it is psychological in nature. The Rules carve
out educational institutions for purposes connected to providing education,
which is where the core product sits when you are processing on the school's
behalf. The trap is that the exemption is purpose-bound, and two obvious
revenue ideas sit outside it:

- A premium parent tier offering counselling matched to a child's profile.
- Licensing anonymised aggregate insights to government or NGOs. Note that
  class-level aggregates over thirty children are far more re-identifiable
  than people assume.

Design that boundary now, with separate consent and a separate data path. This
is cheap to get right at thirty children and very expensive to retrofit at
thirty schools. Talk to a lawyer before school two. Nothing here is legal
advice.

**Reference the first school properly.** A two-minute video of a teacher saying
the product saved her parent meeting preparation is worth more than any deck.

---

## Phase 4: month six, and cutting

By now you know three things you cannot know today:

1. Which four tags account for eighty percent of taps.
2. Which profile section parents actually scroll to.
3. Whether teachers use the written story field at all, or only tap.

Cut ruthlessly on the basis of those. A four-tag version people use beats a
forty-tag version they do not. The vocabulary in `src/data/taxonomy.js` is
deliberately one file for exactly this reason.

---

## What to build next, in order

Ranked by how much each one changes whether this survives.

1. **Offline tolerance.** Teachers log in corridors on patchy 3G. Queue writes
   locally and sync when possible. A lost sweep will cost you a teacher.
2. **WhatsApp delivery alongside the QR code.** The QR is the ceremony.
   WhatsApp is how Indian parents actually receive things.
3. **Multilingual by phrase bank, not machine translation.** Because the output
   is templated, Hindi or Tamil is a strings file a bilingual teacher can
   proofread in an afternoon, and it is correct. Free model prose in four
   languages is neither reviewable nor reliable. This is the concrete payoff of
   keeping the derivation rule-based.
4. **OTP on first scan.** See phase 3.
5. **An LLM pass for prose only.** Over a structured JSON of claims the rules
   already produced, never inventing an observation. Keep the rules underneath
   so that "why does it say this" always has an answer.
6. **Multi-teacher observation of the same child.** A secondary school child
   has six teachers. Six perspectives on one child is a genuinely new thing
   that no report card has ever offered, and the schema already supports it.

---

## Things that will go wrong, and what they mean

**"The teacher stopped logging in week three."**
Almost always time, not belief. Check how long a sweep actually takes her,
with a stopwatch, on her phone, on school wifi. If it is over two minutes, cut
prompts.

**"Every observation is school-only."**
She does not believe the sharing model is safe yet. Usually one specific fear:
a parent screenshotting a concern and sending it to the principal. Talk about
that directly rather than adjusting defaults.

**"The parents said it was lovely" and nothing else happened.**
Lovely is politeness. You want forwarded, screenshotted, quoted back. If you
only get lovely, the profile is not specific enough. Go back to the unlabelled
profile test.

**"The principal wants it for all 1,200 students in January."**
Say no, or at least say one grade. A rollout that outruns the teacher habit
produces 1,200 empty profiles and a school that concludes the product does not
work.

**"A parent asked why it says their child needs encouragement."**
Good. That is the product working. Show them the count and the dates. Every
sentence traces to a counted observation, which is exactly why the derivation
is rule-based rather than generated.
