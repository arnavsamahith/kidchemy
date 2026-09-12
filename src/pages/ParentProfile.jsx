import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Compass,
  Heart,
  MessageCircle,
  Printer,
  Quote,
  Send,
  Sprout,
  TrendingUp,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  SectionTitle,
  Textarea,
  Toast,
  cx,
  useToast,
} from '../components/ui.jsx'
import StrengthMap from '../components/StrengthMap.jsx'
import { Mark } from '../components/AppShell.jsx'
import { useStore } from '../data/store.jsx'
import { useAuth } from '../data/auth.jsx'
import {
  buildNarrative,
  conditionsThatWork,
  conversationStarters,
  dimensionScores,
  dispositionScores,
  evidenceSummary,
  feedNext,
  growthHighlights,
  growthSeries,
  hasStory,
  milestonesOf,
  parentActions,
  pathwaysFor,
  profileDepth,
  storyText,
} from '../data/derive.js'
import { PARENT_GUARDRAILS, stageForGrade } from '../data/pedagogy.js'
import { classLabel } from '../data/roster.js'

/* ─── A quiet section wrapper, for a page meant to be read ───── */

function Section({ eyebrow, title, children, className }) {
  return (
    <section className={cx('kc-avoid-break', className)}>
      <SectionTitle eyebrow={eyebrow}>{title}</SectionTitle>
      {children}
    </section>
  )
}

export default function ParentProfile() {
  const { studentId } = useParams()
  const { getStudent, school, settings, addParentNote } = useStore()
  const { isParent, isTeacher } = useAuth()
  const [toast, setToast] = useToast()
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  const student = getStudent(studentId)

  // The parent only ever sees shared observations. RLS enforces this on the
  // server too; this is belt and braces for the teacher preview.
  const shared = useMemo(
    () =>
      (student?.observations || []).filter(
        (o) => (o.visibility || 'shared') === 'shared'
      ),
    [student]
  )

  const data = useMemo(() => {
    if (!student) return null
    return {
      dims: dimensionScores(shared),
      disp: dispositionScores(shared).filter((d) => d.count > 0),
      narrative: buildNarrative(student, shared),
      conditions: conditionsThatWork(student, shared, 'parent'),
      actions: parentActions(shared, 3),
      questions: conversationStarters(shared, 3),
      feed: feedNext(shared, 2),
      careers: pathwaysFor(
        shared,
        student.grade,
        2,
        settings?.policy?.careerPathwaysMinGrade
      ),
      series: growthSeries(shared),
      highlights: growthHighlights(shared),
      milestones: milestonesOf(shared).slice(0, 3),
      depth: profileDepth(shared),
      stories: shared.filter(hasStory).slice(-3).reverse(),
    }
  }, [student, shared, settings?.policy?.careerPathwaysMinGrade])

  if (!student) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper p-6">
        <Card className="max-w-sm text-center">
          <p className="font-display text-xl font-semibold text-ink">
            We cannot find that child
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            The link may be out of date, or the code may belong to a different
            school. Check the sticker on the report card.
          </p>
          <Button as={Link} to="/parent" className="mt-4">
            Back
          </Button>
        </Card>
      </div>
    )
  }

  const first = student.name.split(' ')[0]
  const stage = stageForGrade(student.grade)

  const submitNote = async () => {
    if (!note.trim()) return
    setSending(true)
    try {
      await addParentNote(student.id, shared[shared.length - 1]?.period || 'Term 1', note.trim())
      setNote('')
      setToast({ message: 'Sent to the teacher. Thank you.' })
    } catch {
      setToast({ message: 'Could not send just now.', tone: 'alert' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-dvh bg-paper">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-line bg-card print:border-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3.5">
          <Link to={isTeacher ? `/teacher/student/${student.id}` : '/parent'} className="flex items-center gap-2">
            <Mark size={26} />
            <span className="font-display text-base font-semibold text-ink">
              Kidchemy
            </span>
          </Link>
          <div className="flex items-center gap-2 print:hidden">
            {isTeacher && (
              <Button
                as={Link}
                to={`/teacher/student/${student.id}`}
                size="sm"
                icon={ArrowLeft}
              >
                Back to your view
              </Button>
            )}
            <Button size="sm" icon={Printer} onClick={() => window.print()}>
              Print
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        {/* ── Hero ──────────────────────────────────────────── */}
        <div className="kc-rise mb-10 text-center">
          <Avatar name={student.name} size={64} className="mx-auto" />
          <p className="kc-eyebrow mt-4">
            {classLabel(student)} - {school?.name || student.school}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Who {first} is
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-ink-soft">
            Not a score, and not a ranking. This is what {first}'s teachers have
            actually watched happen this year.
          </p>
          <p className="mt-4 text-xs text-ink-faint">{evidenceSummary(shared)}</p>
        </div>

        {/* ── Thin profile honesty ──────────────────────────── */}
        {data.depth.score < 25 && (
          <Callout
            tone="neutral"
            icon={Sprout}
            title={`We are still getting to know ${first}`}
            className="mb-8"
          >
            There is not much here yet, and we would rather show you a short
            honest page than a long padded one. A thin page means we have not
            seen enough, not that there is little to see. Ask {first}'s teacher
            what they have noticed.
          </Callout>
        )}

        <div className="space-y-10">
          {/* ── The narrative ───────────────────────────────── */}
          <Section eyebrow="In a paragraph" title={`${first}, this year`}>
            <p className="kc-prose">{data.narrative}</p>
          </Section>

          {/* ── Strength map ────────────────────────────────── */}
          {shared.length > 0 && (
            <Section
              eyebrow="What we have seen"
              title={`What ${first} is good at`}
            >
              <Card>
                <StrengthMap dims={data.dims} />
              </Card>
              <p className="mt-3 text-xs text-ink-faint">
                These are bands, not marks, and they are not compared to anybody
                else. An empty one means we have not seen it yet.
              </p>
            </Section>
          )}

          {/* ── Dispositions ────────────────────────────────── */}
          {data.disp.length > 0 && (
            <Section
              eyebrow="How they learn"
              title={`How ${first} meets a new thing`}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {data.disp.map((d) => (
                  <Card key={d.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{d.label}</p>
                      <Badge tone="moss">{d.band}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-soft">{d.blurb}</p>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {/* ── Conditions ──────────────────────────────────── */}
          {data.conditions.length > 0 && (
            <Section
              eyebrow="Conditions"
              title={`When ${first} does their best work`}
            >
              <p className="kc-prose mb-4">
                This is not a fixed type or a learning style. It is a list of
                the specific situations in which we have watched {first} do
                good work, with how often we have seen each one. It can change,
                and it should.
              </p>
              <div className="space-y-3">
                {data.conditions.map((c) => (
                  <Card key={c.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-bold text-ink">{c.label}</p>
                      <span className="shrink-0 text-2xs text-ink-faint">
                        seen {c.count} time{c.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-base leading-relaxed text-ink-soft">
                      {c.advice}
                    </p>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {/* ── Moments ─────────────────────────────────────── */}
          {data.stories.length > 0 && (
            <Section eyebrow="Moments" title="Things that actually happened">
              <div className="space-y-4">
                {data.stories.map((o, i) => (
                  <Card key={o.id || i} className="border-l-4 border-l-accent">
                    <Quote size={16} className="mb-2 text-accent" />
                    <p className="text-lg leading-relaxed text-ink">
                      {storyText(o, 'saw')}
                    </p>
                    {storyText(o, 'meant') && (
                      <p className="mt-2.5 text-sm text-ink-soft">
                        {storyText(o, 'meant')}
                      </p>
                    )}
                    <p className="mt-3 text-2xs text-ink-faint">
                      {o.teacher ? `${o.teacher}, ` : ''}
                      {o.period}
                    </p>
                  </Card>
                ))}
              </div>
            </Section>
          )}

          {/* ── Growth ──────────────────────────────────────── */}
          {data.series.length > 1 && (
            <Section eyebrow="Across the year" title={`How ${first} is growing`}>
              <Card>
                <ol className="space-y-4">
                  {data.series.map((row) => (
                    <li key={row.period} className="flex gap-4">
                      <span className="w-16 shrink-0 pt-0.5 text-sm font-bold text-ink">
                        {row.period}
                      </span>
                      <span className="flex-1">
                        <span className="block text-base text-ink-soft">
                          {row.standing.length
                            ? `Standing out: ${row.standing.join(', ')}`
                            : 'Nothing recorded this term'}
                        </span>
                        {row.moved.length > 0 && (
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {row.moved.map((m) => (
                              <Badge key={m} tone="good" icon={TrendingUp}>
                                {m} moved this term
                              </Badge>
                            ))}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
                {data.highlights.length > 0 && (
                  <p className="mt-4 border-t border-line pt-4 text-base text-ink-soft">
                    The clearest movement across the year has been in{' '}
                    <strong className="text-ink">
                      {data.highlights.map((h) => h.label.toLowerCase()).join(' and ')}
                    </strong>
                    .
                  </p>
                )}
              </Card>
            </Section>
          )}

          {/* ── What to feed next / careers ─────────────────── */}
          {data.careers.length > 0 ? (
            <Section eyebrow="Looking ahead" title={`Where ${first} could go`}>
              <p className="kc-prose mb-4">
                {first} is at the stage where stream choices become real, so
                this is offered as useful information rather than a prediction.
                There are always more than two doors.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.careers.map((p) => (
                  <Card key={p.id}>
                    <Compass size={17} className="mb-2 text-accent" />
                    <p className="font-display text-lg font-semibold text-ink">
                      {p.title}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-soft">{p.body}</p>
                    <p className="mt-2.5 rounded-[10px] bg-paper-2 p-3 text-sm text-ink-soft">
                      {p.next}
                    </p>
                  </Card>
                ))}
              </div>
            </Section>
          ) : data.feed.length > 0 ? (
            <Section eyebrow="What to feed next" title="What to put in front of them">
              <p className="kc-prose mb-4">
                We do not name careers for children at the {stage.label.toLowerCase()}{' '}
                stage. A career suggested at eleven becomes a label that sticks
                harder than a percentage, because it sounds insightful. What is
                useful now is what to feed the interest.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.feed.map((p) => (
                  <Card key={p.id}>
                    <Sprout size={17} className="mb-2 text-moss" />
                    <p className="font-display text-lg font-semibold text-ink">
                      {p.title}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-soft">{p.body}</p>
                    <p className="mt-2.5 rounded-[10px] bg-moss-tint p-3 text-sm text-ink-soft">
                      {p.tryThis}
                    </p>
                  </Card>
                ))}
              </div>
            </Section>
          ) : null}

          {/* ── Parent actions ──────────────────────────────── */}
          {data.actions.length > 0 && (
            <Section
              eyebrow="At home"
              title="Three things you could try"
            >
              <p className="kc-prose mb-4">
                Each one names what you do, not what {first} should already
                manage, and when to stop doing it. Pick one. One is enough for a
                term.
              </p>
              <ol className="space-y-3">
                {data.actions.map((a, i) => (
                  <li key={i}>
                    <Card>
                      <div className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-tint text-sm font-bold text-accent-ink">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-base font-semibold leading-snug text-ink">
                            {a.move}
                          </p>
                          <p className="mt-1.5 text-sm text-ink-soft">
                            {a.scaffold}
                          </p>
                          <p className="mt-1 text-sm text-ink-faint">
                            You can stop when: {a.fade}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* ── Questions ───────────────────────────────────── */}
          <Section eyebrow="Conversation" title={`Things to ask ${first}`}>
            <div className="space-y-2.5">
              {data.questions.map((q, i) => (
                <Card key={i} className="flex items-start gap-3 bg-moss-tint border-moss-line">
                  <MessageCircle size={16} className="mt-0.5 shrink-0 text-moss" />
                  <p className="text-base text-ink">{q}</p>
                </Card>
              ))}
            </div>
          </Section>

          {/* ── How to use this ─────────────────────────────── */}
          <Section eyebrow="Before you put this down" title="How to read this page">
            <div className="grid gap-3 sm:grid-cols-2">
              {PARENT_GUARDRAILS.map((g, i) => (
                <Card key={i}>
                  <p className="flex gap-2 text-sm font-semibold text-ink">
                    <Heart size={14} className="mt-0.5 shrink-0 text-moss" />
                    {g.do}
                  </p>
                  <p className="mt-2 pl-6 text-sm text-ink-faint">{g.dont}</p>
                </Card>
              ))}
            </div>
          </Section>

          {/* ── Family voice ────────────────────────────────── */}
          {isParent && (
            <Section eyebrow="Your turn" title="What do you see at home?">
              <p className="kc-prose mb-3">
                The teacher sees {first} for six hours in a room with forty
                other children. You see a different child. Both are real, and
                the teacher would like to know about yours.
              </p>
              <Card>
                <Textarea
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="At home he will not stop taking things apart. He fixed the fan regulator last month without being asked."
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="primary"
                    icon={Send}
                    loading={sending}
                    disabled={!note.trim()}
                    onClick={submitNote}
                  >
                    Send to the teacher
                  </Button>
                </div>
              </Card>
            </Section>
          )}
        </div>

        <footer className="mt-14 border-t border-line pt-6 text-center">
          <p className="text-xs text-ink-faint">
            This page is built only from what {first}'s teachers recorded. It is
            not a grade, it is not compared to other children, and it is not
            shared with anyone outside the school.
          </p>
          <p className="mt-2 text-xs text-ink-faint">
            {school?.name} - {classLabel(student)}
          </p>
        </footer>
      </main>

      <Toast toast={toast} />
    </div>
  )
}
