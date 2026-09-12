# The pedagogy behind Kidchemy

Every screen in this product makes a claim about children. This file records
which claims we are making, which established traditions they come from, and
which popular ideas we have deliberately refused. It is the reference for
anyone editing `src/data/taxonomy.js`, `src/data/pedagogy.js` or
`src/data/derive.js`.

Rule: if you cannot trace a sentence the product shows a parent back to
something in this file plus a counted observation, do not ship the sentence.

---

## 1. Montessori: observation is the method, not the paperwork

Montessori training treats observation as the teacher's primary skill. The
core discipline is separating **what was seen** from **what it might mean**.
An observation note that says "Aarav was disruptive" has already skipped to a
verdict. "Aarav left the task three times in ten minutes, each time after the
instruction changed" is an observation, and it is far more useful.

Other durable ideas we use:

- **Follow the child.** The next thing to offer comes from what the child is
  already reaching for, not from where the syllabus happens to be.
- **Sensitive periods.** There are windows when a particular capacity is
  unusually available. Missing one is not fatal, but catching one is cheap.
- **Non-intervention.** Watch before helping. A child who is concentrating
  should not be interrupted, including to praise them.
- **Concentration as the key signal.** Sustained, self-chosen attention is the
  single most informative thing a teacher can notice.

**What we built from it**

| Idea | Where it lives |
| --- | --- |
| Saw vs. meant | The observation form splits every note into "What I saw" and "What I think it means". Only the first is required. |
| Concentration | A dedicated capture: how long the child stayed with a self-chosen task, and whether the task was self-chosen. |
| Non-intervention | "Child of the week" focused-observation mode, with a 10 minute timer and no other duty. |
| Follow the child | The next-step engine keys off the child's own current interest tags, not the syllabus. |

---

## 2. Reggio Emilia: documentation makes learning visible

Reggio's contribution is not an activity list, it is a stance. The child is
"a constructor of experiences to which they are capable of attributing sense
and meaning", and a bearer of rights rather than needs. Documentation
"renders the nature of learning processes visible and evaluable" and turns it
into shared property between school, child and family.

The "hundred languages" idea matters directly to our taxonomy: a child who
cannot yet write a paragraph may be fluent in building, drawing, movement,
argument or care. A tag vocabulary that only rewards verbal and logical
display reproduces exactly the narrowness we claim to be fixing.

**What we built from it**

- The tag vocabulary was widened past the original cognitive and social
  groups to include making, movement, care, and stewardship, so that a child
  whose fluency is not verbal can still accumulate a real profile.
- Observations accept an artefact reference, so the thing the child made can
  be the evidence rather than a sentence about the thing the child made.
- Parents can write back. A profile with a parent's own note on it is a
  shared document rather than a school report, which is the Reggio point.

---

## 3. Learning Stories: the format we actually adopted

Margaret Carr's Learning Stories, developed inside the New Zealand Te Whariki
curriculum, are the closest existing practice to what Kidchemy is trying to
be: narrative, credit-based assessment that records what a child **can** do
and is doing, rather than scoring what they cannot.

The structure is Notice, Recognise, Respond, written out as:

1. What led to this
2. What happened (the narrative, with the child's own words where possible)
3. What it means (the teacher's interpretation, marked as interpretation)
4. Opportunities and possibilities (what to offer next)
5. The family's response (invited, not assumed)

Carr's dispositions are the backbone: taking an interest, being involved,
persisting with difficulty, expressing an idea or feeling, and taking
responsibility.

**What we built from it**

- The freeform note is no longer a blank box. It is the five-part structure,
  with only parts 2 and 4 required, which is what makes it survive a busy
  teacher.
- The five dispositions are a first-class layer alongside the seven
  dimensions. Dispositions answer "how does this child meet learning", the
  dimensions answer "what is this child strong at". They are different
  questions and the product used to conflate them.
- Family response is a field on the record, not a feature request.

---

## 4. Vygotsky: the zone of proximal development

The useful next step for a child is the one just past what they can already
do alone, and reachable with help. Below that band is boredom, above it is
noise. This is the single most actionable idea in the entire literature for a
product whose output is "what should happen next".

**What we built from it**

- The next-step engine ranks suggestions by distance from the child's current
  observed band, not by what sounds impressive. A child at "starting to show"
  in communication is not offered a debate final.
- Every suggestion is phrased as assisted performance: what the adult does,
  not what the child should already manage. "Ask him to explain it to you"
  rather than "he should present more".
- Suggestions carry the scaffold and the fade: what help to give now, and the
  signal that the help can be withdrawn.

---

## 5. Growth mindset, applied properly

Dweck's own correction matters more than the original popularisation. "False
growth mindset" is praising effort as a consolation prize. Praising "great
effort" to a child who is not learning anything makes things worse, not
better. The intervention is effort **plus strategy plus** the link to what
changed.

Equally, the fixed-trait sentence is the failure mode this whole product
exists to avoid. "She is a maths person" and "he is not a details person" are
the report card in nicer clothing.

**What we built from it**

- A language guard in `src/data/pedagogy.js`. A word list of fixed-trait
  constructions is checked against every string the derivation layer produces
  and against teacher-typed notes at write time, with a non-blocking nudge.
- Phrase banks were rewritten from "is a creative child" to "reaches for the
  second answer once the first one is found". Verbs, not labels.
- The parent action layer names the strategy, not just the effort.

---

## 6. What we refused

### Learning styles

The visual / auditory / kinesthetic "meshing hypothesis" is not supported.
Repeated studies find no benefit from matching instruction to a self-reported
style, and some find students do better in the non-preferred modality. It is
one of the most persistent neuromyths in education.

The previous version of Kidchemy had a section headed "How Aryan learns best"
driven by style tags. That section was a liability: it asserted a fixed trait,
on thin evidence, about a child, in a document the parent keeps.

It has been replaced by **"Conditions we have seen work"**, which is a
different and defensible claim: these are the specific situations in which
this child has been observed doing their best work, here is the count, and
here is what to try. Situational, evidenced, revisable.

### Multiple intelligences as a theory of intelligence

Gardner's framework is widely taught and thinly evidenced as a claim about
distinct intelligences. We keep the useful half, which is the reminder to
widen what counts as ability, and we drop the claim. Nowhere does the product
tell a parent their child "is a spatial learner".

### Career prediction below Class 9

Naming a career for an eleven year old creates a label stickier than a
percentage, because it sounds insightful. Below Class 9 the pathway section is
replaced by "What to feed next": clubs, materials, kinds of problems. From
Class 9 the stream choice is real and the information is genuinely useful, so
careers return, always at least two and always visibly different from each
other.

### Anything that reads as surveillance

Self-determination theory is clear that controlling environments, monitoring
and evaluative pressure reduce intrinsic motivation. A product that hands a
parent a weekly behaviour feed would do harm. Hence: term-level rhythm by
default, no live feed, no notifications on individual observations, and an
explicit "how to use this" note to parents that tells them not to turn it
into a second scorecard.

---

## 7. Self-determination theory as the tone guide

Three needs drive motivation: autonomy, competence, relatedness. Every parent
suggestion the product emits is checked against them:

- **Autonomy**: does this give the child a real choice, or is it another
  instruction? "Let one question at dinner run for ten minutes without
  steering it back to studies" supports autonomy. "Make him practise" does not.
- **Competence**: is it optimally challenging, and does it produce visible
  progress the child can feel?
- **Relatedness**: does it involve doing something with the child rather than
  to them?

Suggestions that fail all three are cut from the phrase bank.

---

## 8. The Indian policy layer: NEP 2020, NCF 2023 and the Holistic Progress Card

This is the most commercially important section in this document.

PARAKH, the assessment body under NCERT, has published the Holistic Progress
Card (HPC): a 360 degree, competency-based replacement for the marks-only
report card, mandated in direction by NEP 2020 and the National Curriculum
Framework 2023. It covers four stages (Foundational, Preparatory, Middle,
Secondary) and five domains:

1. Physical Development
2. Socio-Emotional Development
3. Cognitive Development
4. Language and Literacy Development
5. Aesthetic and Cultural Development

Its assessment is multi-stakeholder: teacher assessment, student
self-assessment, peer assessment, and parent or caregiver input. Teacher
judgement is recorded on descriptive performance levels rather than marks
(the published rubric uses a Stream / Mountain / Sky progression), across
abilities including awareness, sensitivity and creativity.

**Why this changes the product and the pitch**

Kidchemy was designed as an optional extra a principal might like. The HPC
turns it into help with something schools are being told to do anyway, and
which every school we will talk to is dreading, because it is a large amount
of qualitative writing per child per term with no tooling.

So:

- Every Kidchemy dimension and disposition now carries an `hpc` mapping to
  one of the five domains. See `src/data/pedagogy.js`.
- The product can emit an HPC-shaped view per child, per stage, built from
  taps the teacher has already made.
- Self-assessment and peer-assessment capture are first-class, not future
  work, because the HPC requires them.
- The pitch changes from "a truer picture of every child" to, in the
  principal's meeting, "your teachers have to produce holistic progress cards.
  This is how they do it in an afternoon instead of a fortnight." The honest
  product underneath does not change.

We are not claiming to be an official PARAKH tool and the product must never
imply certification or approval. It is aligned, not endorsed.

---

## Sources

- [Observation and Intervention, Association Montessori Internationale](https://montessori-ami.org/trainingvoices/observation-and-intervention)
- [Reggio Emilia Approach: Values, Reggio Children](https://www.reggiochildren.it/en/reggio-emilia-approach/valori-en/)
- [Making Learning Visible, Harvard Project Zero](https://pz.harvard.edu/projects/making-learning-visible)
- [Learning Stories: The Power of Narrative Inquiry](https://tecribresearch.blog/2016/03/19/learning-stories-the-power-of-narrative-inquiry/)
- [Autonomy, competence and relatedness in the classroom, Niemiec and Ryan](https://selfdeterminationtheory.org/SDT/documents/2009_NiemiecRyan_TRE.pdf)
- [Carol Dweck Revisits the Growth Mindset, Education Week](https://www.edweek.org/leadership/opinion-carol-dweck-revisits-the-growth-mindset/2015/09)
- [Growth mindset guru Carol Dweck says teachers and parents often use her research incorrectly, Hechinger Report](https://hechingerreport.org/growth-mindset-guru-carol-dweck-says-teachers-and-parents-often-use-her-research-incorrectly/)
- [Learning Styles as a Myth, Yale Poorvu Center](https://poorvucenter.yale.edu/teaching/teaching-resource-library/learning-styles-as-a-myth)
- [The Learning Styles Myth is Thriving in Higher Education, Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.01908/full)
- [Holistic Progress Card, PARAKH NCERT](https://parakh.ncert.gov.in/hpc)
- [Holistic Progress Card analysis, Drishti IAS](https://www.drishtiias.com/daily-updates/daily-news-analysis/holistic-progress-card)
