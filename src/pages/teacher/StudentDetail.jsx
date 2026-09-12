import React, { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ClipboardList,
  Eye,
  EyeOff,
  Feather,
  Flag,
  Lightbulb,
  Link2,
  MessageSquareQuote,
  Pencil,
  Plus,
  Sparkles,
  Timer,
  TrendingUp,
  User,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  CardHead,
  EmptyState,
  Field,
  Meter,
  Modal,
  Segmented,
  Select,
  Tabs,
  Textarea,
  Toast,
  useToast,
} from '../../components/ui.jsx'
import StrengthMap from '../../components/StrengthMap.jsx'
import { useStore } from '../../data/store.jsx'
import {
  conditionsThatWork,
  dimensionScores,
  dispositionScores,
  evidenceSummary,
  growthEdges,
  growthSeries,
  hpcDomains,
  nextSteps,
  profileDepth,
  storyText,
} from '../../data/derive.js'
import { MILESTONE_MAP, TAG_MAP, PERIODS, FREQUENCIES } from '../../data/taxonomy.js'
import { classLabel } from '../../data/roster.js'

/* ─── The child's own voice ──────────────────────────────────── */

function SelfAssessmentModal({ open, onClose, student, onDone }) {
  const { addSelfAssessment, settings } = useStore()
  const [form, setForm] = useState({
    enjoyed: '',
    hard: '',
    wantNext: '',
    feeling: 'steady',
  })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const run = async () => {
    setBusy(true)
    try {
      await addSelfAssessment(student.id, {
        ...form,
        period: settings?.terms?.current || PERIODS[0],
        date: new Date().toISOString().slice(0, 10),
      })
      onDone()
      onClose()
      setForm({ enjoyed: '', hard: '', wantNext: '', feeling: 'steady' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`What ${student.name.split(' ')[0]} says`}
      subtitle="The Holistic Progress Card asks for the child's own voice. Read these out and type what they answer, in their words."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={run}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="What did you enjoy most this term?">
          <Textarea rows={2} value={form.enjoyed} onChange={set('enjoyed')} />
        </Field>
        <Field label="What was hard?">
          <Textarea rows={2} value={form.hard} onChange={set('hard')} />
        </Field>
        <Field label="What do you want to get better at?">
          <Textarea rows={2} value={form.wantNext} onChange={set('wantNext')} />
        </Field>
        <Field label="How does school feel right now?">
          <Segmented
            options={[
              { value: 'growing', label: 'Growing' },
              { value: 'steady', label: 'Steady' },
              { value: 'stuck', label: 'Stuck' },
            ]}
            value={form.feeling}
            onChange={(v) => setForm((f) => ({ ...f, feeling: v }))}
          />
        </Field>
      </div>
    </Modal>
  )
}

/* ─── One observation in the timeline ────────────────────────── */

function ObservationRow({ obs, studentId }) {
  const milestone = obs.milestone ? MILESTONE_MAP[obs.milestone] : null
  const shared = (obs.visibility || 'shared') === 'shared'
  const tags = (obs.tags || []).map((t) => TAG_MAP[t]).filter(Boolean)

  return (
    <article className="rounded-[12px] border border-line bg-card p-4">
      <header className="mb-2.5 flex flex-wrap items-center gap-2">
        <Badge tone="outline">{obs.period}</Badge>
        <span className="kc-tnum text-2xs text-ink-faint">{obs.date}</span>
        {obs.teacher && (
          <span className="text-2xs text-ink-faint">by {obs.teacher}</span>
        )}
        {milestone && <Badge tone="accent">{milestone.label}</Badge>}
        <Badge tone={shared ? 'moss' : 'neutral'} icon={shared ? Eye : EyeOff}>
          {shared ? 'Shared' : 'School only'}
        </Badge>
        <Link
          to={`/teacher/student/${studentId}/observe/${obs.id}`}
          className="ml-auto rounded-lg p-1.5 text-ink-faint hover:bg-paper-2 hover:text-ink"
          aria-label="Edit"
        >
          <Pencil size={14} />
        </Link>
      </header>

      {storyText(obs, 'context') && (
        <p className="mb-2 text-xs italic text-ink-faint">
          {storyText(obs, 'context')}
        </p>
      )}
      {storyText(obs, 'saw') && (
        <p className="text-sm leading-relaxed text-ink">{storyText(obs, 'saw')}</p>
      )}
      {storyText(obs, 'meant') && (
        <p className="mt-2 border-l-2 border-moss-line pl-3 text-sm leading-relaxed text-ink-soft">
          <span className="kc-eyebrow mr-1.5">Reading</span>
          {storyText(obs, 'meant')}
        </p>
      )}
      {storyText(obs, 'next') && (
        <p className="mt-2 flex gap-2 rounded-[10px] bg-accent-tint px-3 py-2 text-sm text-accent-ink">
          <Lightbulb size={14} className="mt-0.5 shrink-0" />
          {storyText(obs, 'next')}
        </p>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.map((t) => (
            <Badge key={t.id} tone={t.isWatch ? 'warn' : 'neutral'}>
              {t.label}
            </Badge>
          ))}
        </div>
      )}

      {Object.entries(obs.tagNotes || {}).length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {Object.entries(obs.tagNotes).map(([tagId, text]) => (
            <li key={tagId} className="text-xs text-ink-soft">
              <span className="font-semibold text-ink">
                {TAG_MAP[tagId]?.label || tagId}:
              </span>{' '}
              {text}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-2xs text-ink-faint">
        {obs.concentrationMinutes ? (
          <span className="flex items-center gap-1">
            <Timer size={11} />
            {obs.concentrationMinutes} min
            {obs.selfChosen ? ', self chosen' : ''}
          </span>
        ) : null}
        {obs.artefactUrl ? (
          <a
            href={obs.artefactUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-semibold text-accent-ink hover:underline"
          >
            <Link2 size={11} /> What they made
          </a>
        ) : null}
        {(obs.dispositions || []).length > 0 && (
          <span>{obs.dispositions.length} disposition noted</span>
        )}
      </div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════ */

export default function StudentDetail() {
  const { studentId } = useParams()
  const { getStudent, setFrequency, settings } = useStore()
  const [toast, setToast] = useToast()
  const [tab, setTab] = useState('picture')
  const [selfOpen, setSelfOpen] = useState(false)

  const student = getStudent(studentId)
  const obs = student?.observations || []

  const data = useMemo(() => {
    if (!student) return null
    return {
      dims: dimensionScores(obs),
      disp: dispositionScores(obs),
      hpc: hpcDomains(obs),
      steps: nextSteps(obs, 3),
      edges: growthEdges(obs, { includeSchoolOnly: true }),
      conditions: conditionsThatWork(student, obs, 'teacher'),
      depth: profileDepth(obs),
      series: growthSeries(obs),
    }
  }, [student, obs])

  if (!student) {
    return (
      <AppShell title="Student not found">
        <EmptyState
          icon={User}
          title="Not in your roster"
          body="That student either does not exist or is not in a class you teach."
          action={
            <Button as={Link} to="/teacher/roster" variant="primary">
              Back to the roster
            </Button>
          }
        />
      </AppShell>
    )
  }

  const first = student.name.split(' ')[0]
  const sorted = [...obs].sort((a, b) => String(b.date).localeCompare(String(a.date)))

  return (
    <AppShell
      wide
      eyebrow={`${classLabel(student)}${student.rollNo ? ` - Roll ${student.rollNo}` : ''}${student.studentCode ? ` - ${student.studentCode}` : ''}`}
      title={student.name}
      subtitle={evidenceSummary(obs)}
      actions={
        <>
          <Button as={Link} to={`/profile/${student.id}`} icon={Eye}>
            See the parent view
          </Button>
          <Button icon={MessageSquareQuote} onClick={() => setSelfOpen(true)}>
            Record their voice
          </Button>
          <Button
            as={Link}
            to={`/teacher/student/${student.id}/observe`}
            variant="primary"
            icon={Plus}
          >
            New observation
          </Button>
        </>
      }
      tabs={
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'picture', label: 'The picture', icon: Sparkles },
            { value: 'next', label: 'What next', icon: Lightbulb },
            { value: 'hpc', label: 'Progress card', icon: ClipboardList },
            { value: 'timeline', label: 'Timeline', icon: Feather, count: obs.length },
          ]}
        />
      }
    >
      {/* Depth banner */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-[12px] border border-line bg-card px-4 py-3">
        <Avatar name={student.name} size={40} />
        <div className="min-w-[180px] flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-xs font-bold text-ink">
              Profile depth: {data.depth.label}
            </span>
            <span className="kc-tnum text-2xs text-ink-faint">
              {data.depth.count} entries, {data.depth.stories} written,{' '}
              {data.depth.terms} term{data.depth.terms === 1 ? '' : 's'}
            </span>
          </div>
          <Meter
            pct={data.depth.score}
            tone={data.depth.score >= 60 ? 'good' : data.depth.score >= 25 ? 'warn' : 'alert'}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="kc-eyebrow">Log</span>
          <Select
            value={student.frequency || 'Weekly'}
            onChange={(e) => setFrequency(student.id, e.target.value)}
            className="h-8 w-32 text-xs"
          >
            {FREQUENCIES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
        </div>
      </div>

      {data.depth.score < 25 && (
        <Callout tone="warn" icon={Flag} className="mb-4" title="This profile is thin">
          There is not enough here yet to say much about {first}, and the parent
          page will say so plainly rather than padding. Two or three more
          observations, ideally with one written story, changes that.
        </Callout>
      )}

      {/* ── Tab: the picture ──────────────────────────────── */}
      {tab === 'picture' && (
        <div className="space-y-4">
          <Card>
            <CardHead
              eyebrow="Strengths"
              title="What we have actually seen"
              subtitle="Bands, not scores. An empty axis means we have not seen it, not that it is absent."
            />
            <StrengthMap dims={data.dims} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHead
                eyebrow="Learning stories"
                title="How they meet the learning"
                subtitle="Carr's dispositions. A different question from what they are good at."
              />
              <ul className="space-y-2.5">
                {data.disp.map((d) => (
                  <li key={d.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{d.label}</span>
                      <Badge tone={d.count ? 'moss' : 'outline'}>{d.band}</Badge>
                    </div>
                    <Meter pct={Math.min(100, d.count * 25)} tone={d.count ? 'moss' : 'faint'} />
                    <p className="mt-1 text-2xs text-ink-faint">{d.blurb}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHead
                eyebrow="Conditions"
                title="When we have seen the best work"
                subtitle="Situational and counted. This is not a learning style, and it is revisable."
              />
              {data.conditions.length ? (
                <ul className="space-y-2.5">
                  {data.conditions.map((c) => (
                    <li key={c.id} className="rounded-[10px] border border-line-soft p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{c.label}</span>
                        <Badge tone="outline">seen {c.count}x</Badge>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{c.advice}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-faint">
                  Nothing yet. Conditions show up once you tap things like
                  "reaches for the materials first" or "answers after a pause".
                </p>
              )}
            </Card>
          </div>

          {data.series.length > 1 && (
            <Card>
              <CardHead
                eyebrow="Across terms"
                title="What moved"
                subtitle="Cumulative, so the line only falls if nothing new is seen."
              />
              <ol className="space-y-3">
                {data.series.map((row) => (
                  <li key={row.period} className="flex gap-4">
                    <span className="w-16 shrink-0 text-xs font-bold text-ink">
                      {row.period}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm text-ink-soft">
                        {row.standing.length
                          ? `Standing out: ${row.standing.join(', ')}`
                          : 'Nothing recorded'}
                      </span>
                      {row.moved.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {row.moved.map((m) => (
                            <Badge key={m} tone="good" icon={TrendingUp}>
                              {m} moved
                            </Badge>
                          ))}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: what next ────────────────────────────────── */}
      {tab === 'next' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead
              eyebrow="Zone of proximal development"
              title="One step past what they manage alone"
              subtitle="Each move names the help you give now, and the signal that the help can go."
            />
            {data.steps.length ? (
              <ol className="space-y-3">
                {data.steps.map((s) => (
                  <li key={s.dimensionId} className="rounded-[12px] border border-line p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge tone="accent">{s.label}</Badge>
                      <span className="text-2xs text-ink-faint">{s.band}</span>
                    </div>
                    <p className="text-sm font-semibold text-ink">{s.move}</p>
                    <p className="mt-1.5 text-sm text-ink-soft">
                      <span className="kc-eyebrow mr-1.5">Scaffold</span>
                      {s.scaffold}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      <span className="kc-eyebrow mr-1.5">Stop when</span>
                      {s.fade}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                icon={Lightbulb}
                title="Nothing to suggest yet"
                body="Suggestions come from observations. Add two or three and this fills in."
              />
            )}
          </Card>

          <Card>
            <CardHead
              eyebrow="Growth edges"
              title="What to work on"
              subtitle="School-only unless you shared the observation. This is the part that keeps the profile believable."
            />
            {data.edges.length ? (
              <ul className="space-y-3">
                {data.edges.map((e) => (
                  <li key={e.id} className="rounded-[12px] border border-warn/25 bg-warn-tint p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">{e.title}</span>
                      <Badge tone="warn">seen {e.count}x</Badge>
                    </div>
                    <p className="text-sm text-ink-soft">{e.teacher}</p>
                    <p className="mt-1.5 text-xs italic text-ink-faint">{e.horizon}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-faint">
                No growth edges logged. That is fine, but a profile that can only
                say nice things stops being believed by the second parent
                meeting. The growth edge tags are in the observation form.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: progress card ────────────────────────────── */}
      {tab === 'hpc' && (
        <div className="space-y-4">
          <Callout tone="info" icon={ClipboardList} title="Holistic Progress Card view">
            The five domains from the NEP 2020 card, built from taps you have
            already made. Kidchemy is aligned with the published framework, not
            endorsed by it.
          </Callout>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.hpc.map((d) => (
              <Card key={d.id}>
                <p className="kc-eyebrow">{d.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-2xl font-semibold text-ink">
                    {d.level?.label || 'Not seen'}
                  </span>
                  <span className="kc-tnum text-2xs text-ink-faint">
                    {d.evidenceCount} signal{d.evidenceCount === 1 ? '' : 's'}
                  </span>
                </div>
                <Meter
                  pct={d.score}
                  tone={d.score >= 62 ? 'good' : d.score >= 30 ? 'warn' : 'faint'}
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-ink-soft">
                  {d.level?.gloss || 'No observations have touched this domain yet.'}
                </p>
                <p className="mt-1.5 text-2xs text-ink-faint">{d.blurb}</p>
              </Card>
            ))}
          </div>

          {(student.selfAssessments || []).length > 0 && (
            <Card>
              <CardHead eyebrow="In their own words" title={`What ${first} says`} />
              <ul className="space-y-3">
                {student.selfAssessments.map((s, i) => (
                  <li key={s.id || i} className="rounded-[12px] border border-line p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge tone="outline">{s.period}</Badge>
                      {s.feeling && <Badge tone="moss">{s.feeling}</Badge>}
                    </div>
                    {s.enjoyed && (
                      <p className="text-sm text-ink">
                        <span className="kc-eyebrow mr-1.5">Enjoyed</span>
                        {s.enjoyed}
                      </p>
                    )}
                    {s.hard && (
                      <p className="mt-1 text-sm text-ink">
                        <span className="kc-eyebrow mr-1.5">Hard</span>
                        {s.hard}
                      </p>
                    )}
                    {(s.want_next || s.wantNext) && (
                      <p className="mt-1 text-sm text-ink">
                        <span className="kc-eyebrow mr-1.5">Wants</span>
                        {s.want_next || s.wantNext}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(student.parentNotes || []).length > 0 && (
            <Card>
              <CardHead eyebrow="Family voice" title="What home says" />
              <ul className="space-y-2">
                {student.parentNotes.map((n, i) => (
                  <li key={i} className="rounded-[10px] bg-paper-2/60 p-3 text-sm text-ink-soft">
                    {n.body}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: timeline ─────────────────────────────────── */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          {sorted.length ? (
            sorted.map((o) => (
              <ObservationRow key={o.id} obs={o} studentId={student.id} />
            ))
          ) : (
            <EmptyState
              icon={Feather}
              title="Nothing recorded yet"
              body={`Add the first observation of ${first}, or run a class sweep and pick them up with everyone else.`}
              action={
                <Button
                  as={Link}
                  to={`/teacher/student/${student.id}/observe`}
                  variant="primary"
                  icon={Plus}
                >
                  New observation
                </Button>
              }
            />
          )}
        </div>
      )}

      <SelfAssessmentModal
        open={selfOpen}
        onClose={() => setSelfOpen(false)}
        student={student}
        onDone={() => setToast({ message: 'Saved in their words.' })}
      />
      <Toast toast={toast} />
    </AppShell>
  )
}
