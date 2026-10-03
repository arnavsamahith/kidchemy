import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Mark } from '../components/AppShell.jsx'
import {
  BREACH_TEXT,
  DATA_WE_HOLD,
  KIDCHEMY_CONTACT,
  NOTICE_VERSION,
  PURPOSES,
  RETENTION_TEXT,
  RIGHTS,
  SCHOOL_CONTACT,
  WE_NEVER,
} from '../data/privacy.js'

/* The privacy notice for families and schools. Plain language first,
   because a notice nobody can read is not a notice (DPDP Act s.5, and
   Rule 3: clear, standalone, itemised). */

function Block({ id, title, children }) {
  return (
    <section id={id} className="grid gap-4 border-t border-neutral-200/70 py-12 md:grid-cols-[0.8fr_1.6fr] md:gap-12">
      <h2 className="font-editorial text-3xl leading-tight text-ink sm:text-4xl">{title}</h2>
      <div className="max-w-2xl space-y-4 text-base leading-[1.8] text-ink-soft">{children}</div>
    </section>
  )
}

function Rows({ rows }) {
  return (
    <dl className="divide-y divide-neutral-200/70 border-y border-neutral-200/70">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
          <dt className="font-semibold text-ink">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function Privacy() {
  const school = SCHOOL_CONTACT.name || SCHOOL_CONTACT.email
  return (
    <div className="kl min-h-dvh bg-paper text-ink">
      <header className="border-b border-neutral-200/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-10">
          <Link to="/" className="flex items-center gap-2">
            <Mark size={26} tone="bare" />
            <span className="font-editorial text-xl">Kidchemy</span>
          </Link>
          <Link to="/" className="kl-link inline-flex items-center gap-1.5 text-sm">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-32 pt-20 md:px-10">
        <p className="kl-label text-ink-faint">Privacy and safety · notice {NOTICE_VERSION}</p>
        <h1 className="mt-4 max-w-4xl font-editorial text-[3rem] leading-[0.98] tracking-[-0.015em] sm:text-[5rem]">
          How your child&rsquo;s record is <em className="text-accent">kept safe.</em>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-[1.8] text-ink-soft">
          The short version: your child&rsquo;s school is in charge of their data. Kidchemy only does what the school asks. Nothing is sold, nothing is advertised, and you can see, correct or erase it whenever you want. Ask the school for this notice in Hindi or your own language.
        </p>

        <div className="mt-16">
          <Block id="who" title="Who is responsible">
            <p>
              Under India&rsquo;s Digital Personal Data Protection Act, 2023, your child&rsquo;s <b className="font-semibold text-ink">school is the Data Fiduciary</b>: it decides why and how the data is used. <b className="font-semibold text-ink">Kidchemy is its Data Processor</b>: we run the software, under a written agreement with the school, and use the data for nothing else.
            </p>
            <p>
              The data is stored with our hosting provider, Supabase, which is bound by contract to keep it secure and cannot use it for anything of its own.
            </p>
            <p>
              Because your child is under 18, nothing is shown to you until you have given consent as their parent or guardian, item by item.
            </p>
          </Block>

          <Block id="what" title="What we hold">
            <Rows rows={DATA_WE_HOLD} />
            <p className="text-sm">Anything not on this list is not collected.</p>
          </Block>

          <Block id="why" title="Why">
            <ul className="space-y-3">
              {PURPOSES.map((p) => (
                <li key={p.id}>
                  <p className="font-semibold text-ink">{p.label}</p>
                  <p>{p.detail}</p>
                </li>
              ))}
            </ul>
            <p>
              The school may also use observations for its own teaching and for children&rsquo;s safety, which the DPDP Rules allow educational institutions to do. It may never be used for anything else.
            </p>
          </Block>

          <Block id="who-sees" title="Who can see it">
            <Rows
              rows={[
                ['You', 'Observations the teacher chose to share, your child’s own words, and the progress card. Only for children you linked with the sticker code and their first name.'],
                ['Teachers', 'Children in their own school. They can change only notes they wrote. Notes marked school-only never reach you.'],
                ['School admin', 'Everything for their school, with two-step sign-in. Every time staff open, print or export a record, it is logged.'],
                ['Classmates', 'Never. Children do not have accounts. When a classmate writes an appreciation, their name is never shown.'],
                ['Anyone else', 'No one. Not other schools, not other parents, not advertisers, not Kidchemy staff except to fix a problem the school reports.'],
              ]}
            />
          </Block>

          <Block id="never" title="What we will never do">
            <ul className="space-y-2">
              {WE_NEVER.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="keep" title="How long we keep it">
            <p>{RETENTION_TEXT}</p>
          </Block>

          <Block id="rights" title="Your rights">
            <Rows rows={RIGHTS} />
            <p>
              Use the buttons under your child&rsquo;s name on your Kidchemy home page. You get a reply within 30 days. The law allows up to 90; we do not think you should wait that long.
            </p>
          </Block>

          <Block id="safety" title="Keeping children safe">
            <p>
              Children never sign in, message anyone, or get contacted through Kidchemy. Notes are about what a child does, never labels about who they are, and careers are not suggested before Class 9.
            </p>
            <p>
              When a teacher writes something that mentions health, a diagnosis, caste, religion, family circumstances or contact details, Kidchemy warns them before it can be shared. If a note reads like a child may be unsafe, the teacher is told to go to the school&rsquo;s safeguarding lead, as the POCSO Act requires, and the note is kept school-only.
            </p>
          </Block>

          <Block id="security" title="How it is protected">
            <ul className="space-y-2">
              {[
                'Encrypted in transit (HTTPS everywhere) and at rest.',
                'Rules inside the database itself decide who can read each row, so a bug in a screen cannot leak another child’s record.',
                'Teacher accounts need a school code that expires. Parent links need the sticker code and the child’s first name, with five tries an hour.',
                'Admins use two-step sign-in. Staff are signed out after 30 idle minutes on shared devices.',
                'An append-only log of sign-ups, consents, changes, and every staff view or export, kept for at least a year.',
                'No third-party scripts, analytics or ads on any page. Fonts are the only outside files the site loads.',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="breach" title="If something goes wrong">
            <p>{BREACH_TEXT}</p>
          </Block>

          <Block id="contact" title="Questions and complaints">
            <p>
              Start with your school{school ? `: ${[SCHOOL_CONTACT.name, SCHOOL_CONTACT.email, SCHOOL_CONTACT.phone].filter(Boolean).join(', ')}` : '. The grievance officer’s name is printed on your welcome letter'}.
              You can also write to {KIDCHEMY_CONTACT.name} at{' '}
              <a className="kl-link" href={`mailto:${KIDCHEMY_CONTACT.email}`}>
                {KIDCHEMY_CONTACT.email}
              </a>
              .
            </p>
            <p>
              If you are not satisfied with the answer, you can complain to the Data Protection Board of India.
            </p>
          </Block>
        </div>
      </main>
    </div>
  )
}
