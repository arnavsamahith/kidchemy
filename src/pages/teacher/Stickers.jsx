import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Printer } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import { useStore } from '../../data/store.jsx'
import { Sprig } from '../../components/Ornament.jsx'

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
      color: { dark: '#1C1C1C', light: '#00000000' },
      errorCorrectionLevel: 'M',
    })
      .then((s) => alive && setSvg(s))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [url])

  return (
    <div className="flex w-[212px] flex-col items-center rounded-2xl border border-line bg-white p-4 text-center">
      <p className="font-display text-lg leading-tight text-ink">Kidchemy</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-clay">
        {student.className || school.className}
      </p>
      <div
        className="mt-3 h-[108px] w-[108px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 text-[13px] font-semibold text-ink">{student.name}</p>
      {student.accessCode && (
        <p className="kc-tnum mt-1.5 rounded-md bg-paper-2 px-2 py-1 text-[11px] font-semibold tracking-[0.08em] text-ink-soft">
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

  return (
    <AppShell
      title="Report card stickers"
      subtitle="One per child. The parent scans it in the room, in front of you."
      actions={
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss-dark"
        >
          <Printer size={15} /> Print sheet
        </button>
      }
    >
      <p className="mb-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-line bg-clay-tint/40 p-4 text-sm leading-relaxed text-ink-soft print:hidden">
        <Sprig className="mt-0.5 h-8 w-6 shrink-0 text-clay" />
        <span>
          The QR opens the profile; the code below it is what the parent types
          when they create their account. Keep the codes on paper — anyone with
          a code can claim that child's profile.
        </span>
      </p>

      <div className="flex flex-wrap gap-4">
        {students.map((s) => (
          <Sticker key={s.id} student={s} school={school} />
        ))}
      </div>
    </AppShell>
  )
}
