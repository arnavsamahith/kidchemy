import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { Printer, ScanLine } from 'lucide-react'
import { useStore } from '../data/store.jsx'
import { Sprig } from '../components/Ornament.jsx'

// The physical artefact: what actually gets glued to a report card.
// Print this page and the stickers come out at roughly 55mm square.

function Sticker({ student, school }) {
  const [svg, setSvg] = useState('')
  const url = `${window.location.origin}/profile/${student.id}`

  useEffect(() => {
    QRCode.toString(url, {
      type: 'svg',
      margin: 0,
      color: { dark: '#1C1C1C', light: '#00000000' },
      errorCorrectionLevel: 'M',
    }).then(setSvg)
  }, [url])

  return (
    <div className="flex w-[210px] flex-col items-center rounded-2xl border border-line bg-white p-4 text-center">
      <p className="font-display text-lg leading-tight text-ink">Kidchemy</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-clay">
        {student.className}
      </p>
      <div
        className="mt-3 h-[110px] w-[110px]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 text-[13px] font-semibold text-ink">{student.name}</p>
      <p className="mt-1 text-[10px] leading-snug text-ink-faint">
        Scan to read who {student.name.split(' ')[0]} is this term — beyond the
        marks on this card.
      </p>
      <p className="mt-2 text-[9px] text-ink-faint">{school.name}</p>
    </div>
  )
}

export default function ReportCardSticker() {
  const { students, school } = useStore()

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-24 pt-8 sm:px-8">
      <header className="print:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">
          The QR moment
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Report card stickers
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          One sticker per child, printed and stuck on the physical report card.
          The parent scans it in the room, in front of the teacher. That moment is
          the whole product.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-white hover:bg-moss-dark"
          >
            <Printer size={15} /> Print sheet
          </button>
          <Link
            to="/teacher"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-ink-faint hover:text-ink"
          >
            <ScanLine size={15} /> Back to class
          </Link>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-line bg-clay-tint/40 p-4 text-sm text-ink-soft">
          <Sprig className="mt-0.5 h-8 w-6 shrink-0 text-clay" />
          <span>
            In the demo these point at <code>localhost</code>, so they only scan
            from this machine. Deploy to a real URL and they work from any phone.
          </span>
        </p>
      </header>

      <div className="mt-10 flex flex-wrap gap-4">
        {students.map((s) => (
          <Sticker key={s.id} student={s} school={school} />
        ))}
      </div>
    </div>
  )
}
