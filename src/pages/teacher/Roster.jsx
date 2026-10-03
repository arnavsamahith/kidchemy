import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Clock,
  Download,
  FileUp,
  Plus,
  Upload,
  Users,
} from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Field,
  Input,
  Meter,
  Modal,
  SearchInput,
  Segmented,
  Select,
  Table,
  Td,
  Th,
  Textarea,
  Toast,
  useToast,
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import { profileDepth, topDimensions } from '../../data/derive.js'
import { daysSince } from '../../data/analytics.js'
import { byRoll, classLabel, makeAccessCode, parseRoster } from '../../data/roster.js'
import { GRADES, SECTIONS } from '../../data/taxonomy.js'
import { writeAudit } from '../../data/supabase.js'

// Quote every cell, and defuse anything Excel would run as a formula.
function csvCell(v) {
  let t = String(v ?? '')
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`
  return `"${t.replace(/"/g, '""')}"`
}

/* ─── Roster import ──────────────────────────────────────────── */

function ImportModal({ open, onClose, onDone }) {
  const { importRoster, school } = useStore()
  const [text, setText] = useState('')
  const [grade, setGrade] = useState('')
  const [section, setSection] = useState('')
  const [busy, setBusy] = useState(false)

  const parsed = useMemo(
    () =>
      parseRoster(text, {
        defaultSchool: school?.name || '',
        defaultGrade: grade,
        defaultSection: section,
      }),
    [text, grade, section, school?.name]
  )

  const run = async () => {
    setBusy(true)
    try {
      const n = await importRoster(parsed.rows)
      onDone(n)
      setText('')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Import your class list"
      subtitle="Paste from a spreadsheet or a CSV your school already exports. A teacher will not type forty names."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            icon={Upload}
            loading={busy}
            disabled={!parsed.rows.length}
            onClick={run}
          >
            Import {parsed.rows.length || ''} student
            {parsed.rows.length === 1 ? '' : 's'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Callout tone="neutral" icon={FileUp}>
          Expected columns, in any order:{' '}
          <strong>
            Student Name, Student ID, Current Grade, Current Section, Current Roll
            Number
          </strong>
          . Most ERP exports already match. Headers are matched loosely, so
          "Adm No" and "Roll" work too.
        </Callout>

        <Field label="Paste here" required>
          <Textarea
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              'Student Name,Student ID,Current Grade,Current Section,Current Roll Number\nAarav Sharma,2019M01,7,C,1'
            }
            className="font-mono text-xs"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Default grade" hint="Used only where the file has none.">
            <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">None</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Default section">
            <Select value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">None</option>
              {SECTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>

        {parsed.errors.length > 0 && (
          <Callout tone="warn">
            <ul className="list-disc pl-4">
              {parsed.errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </Callout>
        )}

        {parsed.rows.length > 0 && (
          <div>
            <p className="kc-eyebrow mb-2">
              Preview, {parsed.rows.length} row
              {parsed.rows.length === 1 ? '' : 's'}
            </p>
            <div className="max-h-56 overflow-y-auto rounded-[10px] border border-line kc-scroll">
              <Table className="min-w-0">
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Student ID</Th>
                    <Th>Class</Th>
                    <Th align="right">Roll</Th>
                    <Th>Access code</Th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 30).map((r) => (
                    <tr key={r.id}>
                      <Td className="font-semibold text-ink">{r.name}</Td>
                      <Td className="kc-tnum">{r.studentCode || '-'}</Td>
                      <Td>{r.className || '-'}</Td>
                      <Td align="right">{r.rollNo ?? '-'}</Td>
                      <Td className="kc-tnum text-2xs">{r.accessCode}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Access codes are generated fresh and are not derived from the
              child's name, so a photographed sticker does not reveal whose it
              is. Existing students with the same student id are updated, not
              duplicated.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ─── Add one student ────────────────────────────────────────── */

function AddStudentModal({ open, onClose, onDone }) {
  const { addStudent, school } = useStore()
  const [form, setForm] = useState({
    name: '',
    studentCode: '',
    grade: school?.grade || '',
    section: school?.section || '',
    rollNo: '',
  })
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const run = async () => {
    if (!form.name.trim()) return
    setBusy(true)
    try {
      const grade = parseInt(form.grade, 10)
      await addStudent({
        id: `s_${Date.now().toString(36)}`,
        name: form.name.trim(),
        studentCode: form.studentCode.trim() || null,
        grade: Number.isFinite(grade) ? grade : null,
        section: form.section || null,
        rollNo: form.rollNo ? parseInt(form.rollNo, 10) : null,
        className:
          Number.isFinite(grade) && form.section
            ? `Grade ${grade}${form.section}`
            : school?.className,
        school: school?.name,
        frequency: 'Weekly',
        accessCode: makeAccessCode(),
      })
      onDone(form.name.trim())
      onClose()
      setForm({ name: '', studentCode: '', grade: '', section: '', rollNo: '' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a student"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={busy} onClick={run} disabled={!form.name.trim()}>
            Add
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Full name" required>
          <Input value={form.name} onChange={set('name')} placeholder="Aarav Sharma" />
        </Field>
        <Field label="Student ID" hint="Whatever the school uses on the register.">
          <Input value={form.studentCode} onChange={set('studentCode')} placeholder="2019M01" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Grade">
            <Select value={form.grade} onChange={set('grade')}>
              <option value="">Grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Section">
            <Select value={form.section} onChange={set('section')}>
              <option value="">Section</option>
              {SECTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Roll no.">
            <Input type="number" value={form.rollNo} onChange={set('rollNo')} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}

/* ══════════════════════════════════════════════════════════════════ */

export default function Roster() {
  const { students, settings, loading } = useStore()
  const [params, setParams] = useSearchParams()
  const [toast, setToast] = useToast()
  const [query, setQuery] = useState('')
  const [view, setView] = useState('table')
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const filter = params.get('filter') || 'all'
  const overdueDays = settings?.policy?.overdueDays ?? 21

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return students
      .filter((s) => !s.archived)
      .map((s) => {
        const obs = s.observations || []
        const last = obs.map((o) => o.date).sort().slice(-1)[0]
        return {
          student: s,
          obs,
          depth: profileDepth(obs),
          last,
          days: last ? daysSince(last) : null,
          top: topDimensions(obs, 2),
        }
      })
      .filter((r) => {
        if (needle) {
          const hay = `${r.student.name} ${r.student.studentCode || ''} ${r.student.rollNo || ''}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        if (filter === 'overdue') return r.days === null || r.days > overdueDays
        if (filter === 'thin') return r.depth.score < 25
        if (filter === 'empty') return r.obs.length === 0
        return true
      })
      .sort((a, b) => byRoll(a.student, b.student))
  }, [students, query, filter, overdueDays])

  const counts = useMemo(() => {
    const active = students.filter((s) => !s.archived)
    return {
      all: active.length,
      empty: active.filter((s) => !(s.observations || []).length).length,
      overdue: active.filter((s) => {
        const last = (s.observations || []).map((o) => o.date).sort().slice(-1)[0]
        return !last || daysSince(last) > overdueDays
      }).length,
      thin: active.filter((s) => profileDepth(s.observations || []).score < 25).length,
    }
  }, [students, overdueDays])

  const exportCsv = () => {
    const header = 'Student Name,Student ID,Current Grade,Current Section,Current Roll Number,Access Code,Observations'
    const body = rows
      .map((r) =>
        [
          r.student.name,
          r.student.studentCode || '',
          r.student.grade ?? '',
          r.student.section || '',
          r.student.rollNo ?? '',
          r.student.accessCode || '',
          r.obs.length,
        ]
          .map(csvCell)
          .join(',')
      )
      .join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'kidchemy-roster.csv'
    a.click()
    // The export carries every child's sticker code, so it is logged.
    writeAudit('roster.export', 'class', classLabel(rows[0]?.student || {}), { count: rows.length })
    URL.revokeObjectURL(a.href)
  }

  return (
    <AppShell
      wide
      eyebrow="Roster"
      title={`${counts.all} child${counts.all === 1 ? '' : 'ren'}`}
      subtitle="Every profile, with how much of it is actually built on evidence."
      actions={
        <>
          <Button icon={Download} onClick={exportCsv} size="md">
            Export
          </Button>
          <Button icon={Plus} onClick={() => setAddOpen(true)}>
            Add one
          </Button>
          <Button variant="primary" icon={Upload} onClick={() => setImportOpen(true)}>
            Import roster
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, student id or roll number"
          className="w-full sm:w-72"
        />
        <Segmented
          options={[
            { value: 'all', label: `All ${counts.all}` },
            { value: 'empty', label: `Never logged ${counts.empty}` },
            { value: 'overdue', label: `Overdue ${counts.overdue}` },
            { value: 'thin', label: `Thin ${counts.thin}` },
          ]}
          value={filter}
          onChange={(v) => setParams(v === 'all' ? {} : { filter: v })}
        />
        <div className="ml-auto">
          <Segmented
            options={[
              { value: 'table', label: 'Table' },
              { value: 'cards', label: 'Cards' },
            ]}
            value={view}
            onChange={setView}
            size="sm"
          />
        </div>
      </div>

      {!rows.length ? (
        <EmptyState
          icon={Users}
          title={query ? 'Nobody matches that' : 'Nothing here'}
          body={
            query
              ? 'Try a different name or roll number.'
              : 'Import the class list your school already has and this fills in.'
          }
          action={
            !query && (
              <Button variant="primary" icon={Upload} onClick={() => setImportOpen(true)}>
                Import roster
              </Button>
            )
          }
        />
      ) : view === 'table' ? (
        <Card flush>
          <Table>
            <thead>
              <tr>
                <Th align="right" className="w-14">
                  Roll
                </Th>
                <Th>Student</Th>
                <Th>Student ID</Th>
                <Th className="w-44">Profile depth</Th>
                <Th>Strongest so far</Th>
                <Th align="right">Entries</Th>
                <Th align="right">Last seen</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student, obs, depth, days, top }) => (
                <tr key={student.id} className="group hover:bg-paper-2/45">
                  <Td align="right" className="text-ink-faint">
                    {student.rollNo ?? '-'}
                  </Td>
                  <Td>
                    <Link
                      to={`/teacher/student/${student.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <Avatar name={student.name} size={30} />
                      <span>
                        <span className="block text-sm font-bold text-ink group-hover:text-accent">
                          {student.name}
                        </span>
                        <span className="block text-2xs text-ink-faint">
                          {classLabel(student)}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="kc-tnum text-xs">{student.studentCode || '-'}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Meter
                        pct={depth.score}
                        tone={depth.score >= 60 ? 'good' : depth.score >= 25 ? 'warn' : 'alert'}
                        className="w-20"
                      />
                      <span className="text-2xs font-semibold text-ink-faint">
                        {depth.label}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {top.length ? (
                        top.map((d) => (
                          <Badge key={d.id} tone="moss">
                            {d.label}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-2xs text-ink-faint">
                          Not seen yet
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td align="right" className="font-semibold text-ink">
                    {obs.length}
                  </Td>
                  <Td align="right">
                    {days == null ? (
                      <Badge tone="alert">Never</Badge>
                    ) : days > overdueDays ? (
                      <Badge tone="warn" icon={Clock}>
                        {days}d
                      </Badge>
                    ) : (
                      <span className="text-2xs text-ink-faint">{days}d ago</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map(({ student, obs, depth, days, top }) => (
            <Link
              key={student.id}
              to={`/teacher/student/${student.id}`}
              className="group rounded-[14px] border border-line bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:border-ink-faint/40 hover:shadow-[var(--shadow-raised)]"
            >
              <div className="flex items-center gap-3">
                <Avatar name={student.name} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink group-hover:text-accent">
                    {student.name}
                  </p>
                  <p className="text-2xs text-ink-faint">
                    {classLabel(student)}
                    {student.rollNo ? ` - Roll ${student.rollNo}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-2xs font-semibold text-ink-faint">
                    {depth.label}
                  </span>
                  <span className="kc-tnum text-2xs text-ink-faint">
                    {obs.length} entr{obs.length === 1 ? 'y' : 'ies'}
                  </span>
                </div>
                <Meter
                  pct={depth.score}
                  tone={depth.score >= 60 ? 'good' : depth.score >= 25 ? 'warn' : 'alert'}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {top.length ? (
                  top.map((d) => (
                    <Badge key={d.id} tone="moss">
                      {d.label}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="outline">Not observed yet</Badge>
                )}
                {days != null && days > overdueDays && (
                  <Badge tone="warn" icon={Clock}>
                    {days}d
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={(n) => setToast({ message: `Imported ${n} students.` })}
      />
      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onDone={(name) => setToast({ message: `${name} added.` })}
      />
      <Toast toast={toast} />
    </AppShell>
  )
}
