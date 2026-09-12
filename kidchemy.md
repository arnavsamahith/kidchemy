# Pehchaan, Child Profile Platform
## Complete Product Brief + Build Prompt

---

## WHY THIS EXISTS

The Indian education system, and most education systems globally, reduces every child to a single number: a grade, a rank, a percentage. A child who scores 58% in Science is labeled "weak in Science." But that same child might have extraordinary observational skills, ask the best questions in class, or understand concepts deeply but struggle to express them in an exam format.

Report cards, as they exist today, do one thing: they compare every child to the same benchmark and assign a rank. They tell you where a child stands. They say nothing about *who* the child is, how they think, what they're good at, or where they could go.

This is a problem for three people:

- **The student**, who internalizes a number as their identity
- **The parent**, who has no real insight into their child's mind, only a scorecard, and defaults to chasing marks
- **The teacher**, who observes rich, nuanced things about each child every day but has no structured way to communicate them

The result: parents coach grades. Schools rank children. And an entire generation of kids grows up believing they are their score.

---

## WHAT WE'RE BUILDING

**Pehchaan** is a living child profile platform, a layer on top of the existing school system that captures what a child *actually is*, not just what they scored.

It works like this:

- Teachers observe their students and fill in structured, lightweight observations, not essays, not long forms. Quick tags, short notes, a few taps.
- The platform aggregates these observations over time into a **rich, multi-dimensional profile** for each child, showing strengths, learning style, growth trajectory, and potential pathways.
- Parents access this profile, beautifully designed, written in plain language, via a **QR code printed on the physical report card** (or directly on the platform). No replacement of existing systems. Pure augmentation.
- The profile grows with the child, weekly, monthly, or per-term depending on what the teacher chooses.

The goal is not to replace grades. It is to make grades irrelevant to a child's sense of self, and to give every stakeholder, student, parent, teacher, a more truthful picture.

---

## THE PRODUCT: FEATURE SET

### 1. Teacher Dashboard
The teacher's workspace. Simple, fast, built for a busy classroom.

**For each child, a teacher can fill in:**

**Observation Tags (tap to select, pre-built categories):**
- *Cognitive:* Strong logical thinking / Creative problem-solver / Great at memorization / Thinks in patterns / Asks deep questions / Understands concepts quickly / Needs more time to process
- *Social:* Natural leader / Works well in teams / Prefers working alone / Helps peers unprompted / Communicates confidently / Shy but thoughtful
- *Emotional:* Persists through difficulty / Gets frustrated but recovers / Highly motivated / Needs encouragement / Shows empathy / Emotionally expressive
- *Interests:* Shows curiosity in [subject] / Lights up during [activity type] / Disengages during [activity type]

**Short freeform note (optional, 2-3 sentences max):**
> "Priya surprised everyone today by explaining Newton's third law using a real-life example no one had thought of. She struggles with rote recall but her conceptual grasp is exceptional."

**Milestone flags:**
- Had a breakthrough moment
- Showed significant improvement
- Needs attention / follow-up
- Demonstrated leadership
- Showed unusual creativity

**Subject-level insight (per subject, per term):**
- Concept understanding: Strong / Developing / Needs support
- Application ability: Strong / Developing / Needs support
- Engagement level: High / Medium / Low
- One sentence on what they did well / what to focus on next

**Frequency:** Teacher chooses, Daily quick log / Weekly summary / Monthly report / Per term

---

### 2. Child Profile (Parent View)
The parent-facing profile. Warm, beautiful, written in plain language. Not a dashboard of metrics, a *portrait* of their child.

**Sections:**

**"Who [Child Name] is"**
An AI-generated narrative paragraph synthesizing teacher observations:
> "Aryan is a curious, independent thinker who tends to approach problems from unusual angles. He's at his best when given room to explore, structured tasks with a single right answer don't show his real ability. He has a natural gift for making connections between ideas."

**"What [Child Name] is good at"**
Visual skill map, not scores, but observed strengths plotted across dimensions: Creativity, Logic, Communication, Curiosity, Collaboration, Persistence, Empathy. Each dimension has a short explanation, not just a bar.

**"How [Child Name] learns best"**
Learning style insights: Does this child need to see something to understand it? Do they need to try it themselves? Do they learn by explaining it to others?
> "Aryan learns best by doing. Abstract explanations don't stick, but give him a physical example or a real scenario and he grasps it immediately. At home, try explaining concepts through real-world examples."

**"How [Child Name] is growing"**
Timeline of growth across terms, not academic scores, but observable growth in key dimensions. Shows trajectory, not just current state.
> "Aryan's confidence in speaking up has grown significantly since Term 1. His curiosity score has increased every term."

**"Where [Child Name] could go"**
Pathway suggestions based on observed strengths and interests:
> "Children who think like Aryan, spatial, hands-on, pattern-oriented, often thrive in fields like engineering, architecture, industrial design, or entrepreneurship. Here's what that could look like from Class 7 onward."
Concrete, age-appropriate, not prescriptive. Presented as possibilities, not prophecies.

**"What you can do this month" (Parent Action Layer)**
3 specific, practical things a parent can do at home based on current observations:
- "Ask Aryan to explain his homework to you instead of checking if it's right, he learns by teaching"
- "Let him take apart something broken at home and try to fix it"
- "Watch a documentary together about how things are made"

**"Questions to ask [Child Name]"**
Conversation starters that open dialogue instead of interrogation:
- "What's something you figured out by yourself this week?"
- "Is there anything at school you wish was taught differently?"
- "What do you think you're getting better at?"

---

### 3. QR Code Integration
Every school that uses Pehchaan gets a QR sticker / print template that goes on the physical report card. When scanned:
- First-time parents land on a warm onboarding screen: "Here's what we discovered about [Child Name] this term"
- Returns a unique, password-protected profile page
- Works on any smartphone, no app download required
- Available in English, Hindi, Tamil, Telugu (multilingual from day one)

---

### 4. Admin / School Dashboard
For school administrators:
- See all children across all classrooms
- Track which teachers have completed observations
- Aggregate class-level insights (anonymized): "30% of Class 6 students show low engagement in Mathematics, possible curriculum gap"
- Export profiles as PDFs for parent-teacher meetings

---

## WHAT THIS IS NOT

- Not a grading tool
- Not a replacement for report cards
- Not a surveillance system for children
- Not an app parents need to download and manage
- Not another edtech dashboard full of charts

---

## WHO USES IT

**Primary:** Teachers at K-12 schools (private schools first, government schools as scale play)
**Secondary:** Parents of students aged 6-16
**Tertiary:** School administrators, eventually counselors and colleges

**Go-to-market:** Start with one school, one classroom, 30 children. Get parents to react to the profile. If they cry, or say "this is the first time someone actually described my child," you have product-market fit.

---

## MONETIZATION

- Schools pay ₹200-500/student/year (B2B, annual contract)
- Free forever for parents
- Premium parent tier: deeper 1:1 counseling sessions matched to child's profile
- Government/NGO licensing: anonymized aggregate insights for education policy

---

## DESIGN DIRECTION

The product should feel nothing like a school management system or an edtech dashboard.

**Visual identity:**
- Warm, human, almost like a children's book illustration meets a modern consumer app
- Think: Notion's calm + Duolingo's warmth + a beautifully designed annual report
- Each child's profile should feel like a *portrait*, not a record
- Typography: a warm humanist sans for body, a slightly expressive display face for headings
- Color: warm off-whites, earthy greens, a single human accent color, not blues and grays
- No stock illustrations of children. Abstract shapes, botanical motifs, or hand-drawn-feeling icons instead.

**UX principles:**
- Teacher flow: under 3 minutes to complete an observation
- Parent flow: under 2 minutes to feel something real about their child
- Mobile-first, most Indian parents and teachers access everything on mobile
- Works on slow connections

---

---

# PROMPT TO BUILD THE MVP

Paste this into a fresh Claude Pro session:

---

```
I want to build a web platform called Pehchaan, a child profile platform for schools.

The core idea: teachers fill in lightweight observations about each student, and parents see a beautiful, human profile of their child, not grades, but insights about who their child is, how they learn, what they're good at, and where they could go.

It's designed to sit alongside the existing report card system (parents access it via a QR code on the physical report card), not replace it.

Build me a full-stack MVP with these two views:

---

## VIEW 1: TEACHER DASHBOARD

A clean, fast interface where a teacher can:

1. See their class roster (list of student names/cards)
2. Click into any student to fill an observation

The student observation form should include:

**A) Observation Tags (multi-select, grouped by category)**
Categories:
- Cognitive: "Strong logical thinking", "Creative problem-solver", "Asks deep questions", "Understands concepts quickly", "Needs more time to process", "Thinks in patterns"
- Social: "Natural leader", "Works well in teams", "Helps peers unprompted", "Communicates confidently", "Prefers working alone"
- Emotional: "Persists through difficulty", "Highly motivated", "Shows empathy", "Needs encouragement", "Gets frustrated but recovers"
- Interests: "Curious in Sciences", "Lights up during creative tasks", "Engaged in hands-on activities", "Shows interest in stories/language"

**B) Short note (optional textarea, max 200 characters)**
Placeholder: "Something specific you noticed today..."

**C) Milestone flags (single select or none)**
Options: "Breakthrough moment", "Significant improvement", "Needs attention", "Showed leadership", "Unusual creativity"

**D) Subject insights (for each of 3-4 subjects)**
Each subject has:
- Concept understanding: Strong / Developing / Needs support (radio)
- Engagement: High / Medium / Low (radio)
- One short note (optional, 100 char max)

**E) Observation frequency setting (per student)**
How often teacher plans to update: Daily / Weekly / Monthly / Per Term

On submit, show a confirmation and return to class roster.

---

## VIEW 2: PARENT / STUDENT PROFILE PAGE

A beautiful, warm, mobile-first profile page for a single child. This is what parents see when they scan the QR code.

It should include these sections:

**1. Hero section**
Child's name, class, school. A warm greeting: "Here's who [Name] is this term."

**2. "Who [Name] is"**
An AI-synthesized paragraph (you can mock this for now with a static example) describing the child based on the tags filled in. Warm, human, written like a letter, not a report.

**3. Strength Map**
A visual representation (radar/spider chart or a set of illustrated dimension cards) of key dimensions:
Creativity · Logic · Curiosity · Collaboration · Communication · Persistence · Empathy
Each dimension shown based on aggregated tags (mock data is fine for MVP).

**4. "How [Name] learns best"**
2-3 sentences on their learning style derived from observations. Static for MVP.

**5. "How [Name] is growing"**
A simple timeline or progress indicator showing growth across the last 2-3 observation periods.

**6. "Where [Name] could go"**
1-2 pathway suggestions based on observed strengths. Keep it warm and non-prescriptive:
Example: "Children who think like [Name] often thrive in fields like design, engineering, or entrepreneurship. Here's what that path could look like."

**7. "What you can do this month"**
3 specific, actionable suggestions for parents. Derived from observations. Static for MVP.

**8. "Questions to ask [Name]"**
3 conversation starters. Static for MVP.

---

## TECH STACK

- React frontend (clean, component-based)
- Use Tailwind CSS for styling
- For now, use mock data / localStorage for persistence (no backend needed for MVP)
- The teacher and parent views should be separate routes: /teacher and /profile/:studentId
- Make it mobile-first and responsive

---

## DESIGN DIRECTION

This should NOT look like a school management system or edtech dashboard.

- Warm color palette: off-white background (#FAF8F4), earthy green accent (#4A7C59), warm clay secondary (#C17B4E), dark charcoal text (#1C1C1C)
- Typography: use Google Fonts, "DM Serif Display" for headings, "Inter" for body
- Rounded cards, generous whitespace, no harsh borders
- The profile page should feel like reading a beautiful letter about your child, not looking at a report
- Icons: use Lucide React
- No stock illustrations, use simple geometric or botanical-inspired SVG shapes as decorative elements

---

## SAMPLE DATA

Pre-populate with 5 students in one class:
- Aryan Mehta, Class 6A
- Priya Sharma, Class 6A
- Rohan Gupta, Class 6A
- Ananya Nair, Class 6A
- Kabir Singh, Class 6A

Each should have some pre-filled observations so the parent profile view shows real content.

---

Build the full MVP. Start with the component structure, then build teacher view, then parent profile view. Make it feel genuinely beautiful, this is a product parents will judge in the first 10 seconds of opening it.
```

---

## HOW TO GO ABOUT BUILDING THIS (ROADMAP)

### Week 1, MVP
Build the above. Get it working locally. Show it to 3 teachers and 3 parents you know. Watch their faces, not their words.

### Week 2, First School
Find one school principal in your network (IITM alumni network, family connections, anyone). Show them the demo. Ask if you can run a pilot with one class (30 students, one teacher). Do it for free.

### Week 3-4, Iterate on Feedback
The teacher input flow will be too long. Cut it. The parent profile will miss something emotional. Add it. The pathway section will feel generic. Make it specific.

### Month 2, The QR Moment
Design the physical QR sticker. Work with the school to put it on actual report cards at the next parent-teacher meeting. Watch parents scan it in real time. That moment will tell you everything.

### Month 3, Expand
Second school. Third. Start charging school #3. Use the first two as case studies.

### 6 Months, The Real Product
By now you know what teachers actually fill in (vs what you designed), what parents actually read (vs what you built), and what the hardest part of the problem really is. Build that.
```
