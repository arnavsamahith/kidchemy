import React, { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Printer, QrCode, ShieldCheck } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  Button,
  Callout,
  Card,
  CardHead,
  Chip,
  EmptyState,
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import { byRoll, classLabel } from '../../data/roster.js'

// The physical artefact: what actually gets glued to a report card.
// Prints at roughly 55mm square.

function Sticker({ student, school }) {
  const [svg, setSvg] = useState('')
  const url = `${window.location.origin}/profile/${student.id}`

  useEffect(() => {
    let alive = true
    QRCode.toString(url, {
      type: 'svg',
      margin: 0,
      color: { dark: '#16130d', light: '#00000000' },
      errorCorrectionLevel: 'M',
    })
      .then((s) => alive && setSvg(s))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [url])

  return (
    <div className="kc-avoid-break flex w-[214px] flex-col items-center rounded-[14px] border border-line bg-white p-4 text-center">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-[5px] bg-accent" />
        <p className="font-display text-base font-semibold leading-none text-ink">
          Kidchemy
        </p>
      </div>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-ink">
        {classLabel(student) || school.className}
      </p>
      <div
        className="mt-3 h-[104px] w-[104px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 text-[13px] font-bold text-ink">{student.name}</p>
      {student.accessCode && (
        <p className="kc-tnum mt-1.5 rounded-md bg-paper-2 px-2 py-1 text-[11px] font-bold tracking-[0.08em] text-ink-soft">
          {student.accessCode}
        </p>
      )}
      <p className="mt-2 text-[10px] leading-snug text-ink-faint">
        Scan, then sign up with this code to read who{' '}
        {student.name.split(' ')[0]} is this term.
      </p>
      <p className="mt-1.5 text-[9px] text-ink-faint">{school.name}</p>
    </div>
  )
}

export default function Stickers() {
  const { students, school } = useStore()
  const [selected, setSelected] = useState([])

  const roster = useMemo(
    () => students.filter((s) => !s.archived).sort(byRoll),
    [students]
  )
  const shown = selected.length
    ? roster.filter((s) => selected.includes(s.id))
    : roster

  if (!roster.length) {
    return (
      <AppShell title="Report card stickers">
        <EmptyState
          icon={QrCode}
          title="No students yet"
          body="Import a roster and each child gets a code and a sticker."
        />
      </AppShell>
    )
  }

  return (
    <AppShell
      wide
      eyebrow="Report card codes"
      title="One sticker per child"
      subtitle="Print, cut, and stick on the physical report card before the next parent meeting. The QR is the ceremony; the code underneath is what actually links the parent to the child."
      actions={
        <Button variant="primary" icon={Printer} onClick={() => window.print()}>
          Print {shown.length} sticker{shown.length === 1 ? '' : 's'}
        </Button>
      }
    >
      <Callout tone="neutral" icon={ShieldCheck} className="mb-4 print:hidden">
        Access codes are randomly generated and carry no part of the child's
        name, so a sticker photographed on a desk does not reveal whose it is.
        A parent has to sign up with the code before they see anything, and they
        only ever see observations a teacher marked as shared.
      </Callout>

      <Card className="mb-5 print:hidden">
        <CardHead
          eyebrow="Who"
          title="Pick the children"
          subtitle={
            selected.length ? `${selected.length} selected.` : 'Nothing selected means everybody.'
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
                  prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                )
              }
            >
              {s.name}
            </Chip>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-4 print:gap-2">
        {shown.map((s) => (
          <Sticker key={s.id} student={s} school={school} />
        ))}
      </div>
    </AppShell>
  )
}
