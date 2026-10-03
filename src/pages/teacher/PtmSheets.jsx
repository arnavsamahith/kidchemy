import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Printer, Users } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  Button,
  Callout,
  Card,
  CardHead,
  Chip,
  EmptyState,
  Meter,
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import { ptmSheet } from '../../data/derive.js'
import { byRoll, classLabel } from '../../data/roster.js'
import { writeAudit } from '../../data/supabase.js'

/* ══════════════════════════════════════════════════════════════════
   Parent meeting sheets
   The teacher's payback, generated from taps they have already made.
   Three things to praise, one to raise, two to ask. One page per child,
   printed, in their hand, before the meeting.
   ══════════════════════════════════════════════════════════════════ */

function Sheet({ sheet, school }) {
  const { student, praise, raise, ask, stories, depth } = sheet
  return (
    <article className="kc-avoid-break rounded-[14px] border border-line bg-card p-6 print:border-0 print:p-0 print:pb-10">
      <header className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-3">
        <div>
          <p className="kc-eyebrow">Parent meeting sheet</p>
          <h2 className="font-display text-2xl font-semibold text-ink">
            {student.name}
          </h2>
          <p className="text-xs text-ink-faint">
            {classLabel(student)}
            {student.rollNo ? ` - Roll ${student.rollNo}` : ''} - {school?.name}
          </p>
        </div>
        <div className="w-28 text-right">
          <p className="kc-eyebrow">Evidence</p>
          <p className="text-xs font-bold text-ink">{depth.label}</p>
          <Meter
            pct={depth.score}
            tone={depth.score >= 60 ? 'good' : depth.score >= 25 ? 'warn' : 'alert'}
            className="mt-1"
          />
        </div>
      </header>

      <section className="mb-4">
        <p className="kc-eyebrow mb-2">Three things to praise, with the evidence</p>
        {praise.length ? (
          <ol className="space-y-2">
            {praise.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-moss-tint text-2xs font-bold text-moss">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">{p.title}</span>
                  <span className="block text-sm text-ink-soft">{p.line}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink-faint">
            Not enough recorded yet to praise anything specific. Say that
            honestly rather than improvising.
          </p>
        )}
      </section>

      {raise && (
        <section className="mb-4 rounded-[10px] border border-warn/25 bg-warn-tint p-3">
          <p className="kc-eyebrow mb-1">One thing to raise</p>
          <p className="text-sm font-bold text-ink">{raise.title}</p>
          <p className="mt-1 text-sm text-ink-soft">{raise.line}</p>
          {raise.horizon && (
            <p className="mt-1 text-xs italic text-ink-faint">{raise.horizon}</p>
          )}
        </section>
      )}

      <section className="mb-4">
        <p className="kc-eyebrow mb-2">Two questions to ask the parent</p>
        <ul className="space-y-1.5">
          {ask.map((q, i) => (
            <li key={i} className="text-sm text-ink-soft">
              {i + 1}. {q}
            </li>
          ))}
        </ul>
      </section>

      {stories.length > 0 && (
        <section>
          <p className="kc-eyebrow mb-2">Specific moments you can quote</p>
          <ul className="space-y-2">
            {stories.map((s, i) => (
              <li key={i} className="border-l-2 border-line pl-3">
                <p className="text-sm text-ink">{s.saw}</p>
                {s.meant && (
                  <p className="mt-0.5 text-xs text-ink-faint">{s.meant}</p>
                )}
                <p className="mt-0.5 text-2xs text-ink-faint">
                  {s.period} - {s.date}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-5 border-t border-line pt-3">
        <p className="kc-eyebrow mb-1.5">Notes from the meeting</p>
        <div className="h-16 rounded-[8px] border border-dashed border-line" />
      </footer>
    </article>
  )
}

export default function PtmSheets() {
  const { students, school } = useStore()
  const [selected, setSelected] = useState([])

  const roster = useMemo(
    () => students.filter((s) => !s.archived).sort(byRoll),
    [students]
  )

  const sheets = useMemo(() => {
    const list = selected.length
      ? roster.filter((s) => selected.includes(s.id))
      : roster
    return list.map((s) => ptmSheet(s, s.observations || []))
  }, [roster, selected])

  if (!roster.length) {
    return (
      <AppShell title="Parent meeting sheets">
        <EmptyState
          icon={Users}
          title="No students yet"
          body="Import a roster and log a few observations, and these generate themselves."
          action={
            <Button as={Link} to="/teacher/roster" variant="primary">
              Go to the roster
            </Button>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      wide
      eyebrow="Parent meetings"
      title="One page per child, before you sit down"
      subtitle="Generated from the taps you already made. Three things to praise with the evidence attached, one thing to raise, two questions to ask."
      actions={
        <Button variant="primary" icon={Printer} onClick={() => {
          writeAudit('print.ptm_sheets', 'class', null, {})
          window.print()
        }}>
          Print {sheets.length} sheet{sheets.length === 1 ? '' : 's'}
        </Button>
      }
    >
      <Callout tone="neutral" icon={ClipboardList} className="mb-4 print:hidden">
        Teachers dread parent meetings and have nothing to say past the marks.
        This is the part of Kidchemy that pays you back inside a week, in the
        currency that matters: walking into the room prepared.
      </Callout>

      <Card className="mb-5 print:hidden">
        <CardHead
          eyebrow="Who"
          title="Pick the children"
          subtitle={
            selected.length
              ? `${selected.length} selected.`
              : 'Nothing selected means everybody.'
          }
          actions={
            selected.length ? (
              <Button size="sm" onClick={() => setSelected([])}>
                Clear
              </Button>
            ) : null
          }
        />
        <div className="flex flex-wrap gap-1.5">
          {roster.map((s) => (
            <Chip
              key={s.id}
              active={selected.includes(s.id)}
              onClick={() =>
                setSelected((prev) =>
                  prev.includes(s.id)
                    ? prev.filter((id) => id !== s.id)
                    : [...prev, s.id]
                )
              }
            >
              {s.name}
            </Chip>
          ))}
        </div>
      </Card>

      <div className="space-y-5 print:space-y-0">
        {sheets.map((sheet) => (
          <div key={sheet.student.id} className="kc-page-break">
            <Sheet sheet={sheet} school={school} />
          </div>
        ))}
      </div>
    </AppShell>
  )
}
