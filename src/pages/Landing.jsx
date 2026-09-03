import { Link } from 'react-router-dom'
import { ArrowRight, QrCode } from 'lucide-react'
import { useStore } from '../data/store.jsx'
import { Sprig, Arc } from '../components/Ornament.jsx'

export default function Landing() {
  const { students, school } = useStore()

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-14 sm:px-8">
      <div className="relative">
        <Arc className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 text-clay opacity-70" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">
          Kidchemy
        </p>
        <h1 className="mt-4 font-display text-4xl leading-[1.08] text-ink sm:text-6xl">
          A child is not
          <br />a percentage.
        </h1>
        <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-soft">
          Teachers see extraordinary things every day and have nowhere to put
          them. Kidchemy gives them somewhere — a few taps per child — and turns
          it into a profile a parent actually wants to read.
        </p>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-faint">
          It sits on top of the report card. It replaces nothing.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          to="/teacher"
          className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 font-semibold text-white transition hover:bg-moss-dark"
        >
          Teacher view <ArrowRight size={16} />
        </Link>
        <Link
          to={`/profile/${students[0].id}`}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 font-semibold text-ink-soft transition hover:border-ink-faint hover:text-ink"
        >
          A parent's view
        </Link>
        <Link
          to="/stickers"
          className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-semibold text-ink-soft transition hover:border-ink-faint hover:text-ink"
        >
          <QrCode size={16} /> Report card stickers
        </Link>
      </div>

      <section className="relative mt-16 overflow-hidden rounded-3xl border border-line bg-white/70 p-6 sm:p-8">
        <Sprig className="pointer-events-none absolute -right-2 -top-4 h-48 w-32 text-moss" />
        <h2 className="font-display text-2xl text-ink">Demo classroom</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {school.name} · {school.className} · {school.teacher}
        </p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                to={`/profile/${s.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-3 text-ink transition hover:border-moss"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-ink-faint">
                  {s.observations.length} obs
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
