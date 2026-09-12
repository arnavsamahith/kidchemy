import React, { useEffect, useState } from 'react'
import { KeyRound, Plus, RefreshCw, Shield, Trash2, UserCog } from 'lucide-react'
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
  Modal,
  SearchInput,
  Select,
  Table,
  Tabs,
  Td,
  Th,
  Toast,
  useToast,
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import { readableAuthError } from '../../data/auth.jsx'
import {
  deleteTeacherCode,
  loadProfiles,
  loadTeacherCodes,
  saveTeacherCode,
  setUserRole,
} from '../../data/supabase.js'
import { GRADES, SECTIONS } from '../../data/taxonomy.js'

const ROLE_TONE = { admin: 'accent', teacher: 'moss', parent: 'neutral' }

export default function AdminPeople() {
  const { school } = useStore()
  const [toast, setToast] = useToast()
  const [tab, setTab] = useState('accounts')
  const [profiles, setProfiles] = useState([])
  const [codes, setCodes] = useState([])
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const [roleForm, setRoleForm] = useState({ email: '', role: 'teacher' })
  const [codeForm, setCodeForm] = useState({
    code: '',
    school: '',
    grade: '',
    section: '',
    usesLeft: '',
  })

  const reload = async () => {
    setBusy(true)
    try {
      const [p, c] = await Promise.all([loadProfiles(), loadTeacherCodes()])
      setProfiles(p)
      setCodes(c)
    } catch (e) {
      setToast({ message: readableAuthError(e), tone: 'alert' })
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = profiles.filter((p) => {
    const n = query.trim().toLowerCase()
    if (!n) return true
    return `${p.full_name || ''} ${p.school || ''} ${p.role}`.toLowerCase().includes(n)
  })

  const applyRole = async () => {
    setBusy(true)
    try {
      await setUserRole(roleForm.email, roleForm.role)
      setToast({ message: `${roleForm.email} is now a ${roleForm.role}.` })
      setRoleOpen(false)
      setRoleForm({ email: '', role: 'teacher' })
      await reload()
    } catch (e) {
      setToast({ message: readableAuthError(e), tone: 'alert' })
    } finally {
      setBusy(false)
    }
  }

  const applyCode = async () => {
    setBusy(true)
    try {
      await saveTeacherCode({
        ...codeForm,
        school: codeForm.school || school?.name,
        className:
          codeForm.grade && codeForm.section
            ? `Grade ${codeForm.grade}${codeForm.section}`
            : null,
      })
      setToast({ message: 'Code saved.' })
      setCodeOpen(false)
      setCodeForm({ code: '', school: '', grade: '', section: '', usesLeft: '' })
      await reload()
    } catch (e) {
      setToast({ message: readableAuthError(e), tone: 'alert' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell
      wide
      eyebrow="Superadmin"
      title="Accounts and codes"
      subtitle="Who can sign in, as what, and which school codes let a teacher through the door."
      actions={
        <>
          <Button icon={RefreshCw} onClick={reload} loading={busy}>
            Refresh
          </Button>
          {tab === 'accounts' ? (
            <Button variant="primary" icon={UserCog} onClick={() => setRoleOpen(true)}>
              Change a role
            </Button>
          ) : (
            <Button variant="primary" icon={Plus} onClick={() => setCodeOpen(true)}>
              New school code
            </Button>
          )}
        </>
      }
      tabs={
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'accounts', label: 'Accounts', icon: Shield, count: profiles.length },
            { value: 'codes', label: 'School codes', icon: KeyRound, count: codes.length },
          ]}
        />
      }
    >
      {tab === 'accounts' && (
        <>
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, school or role"
            className="mb-4 w-full sm:w-72"
          />
          {filtered.length ? (
            <Card flush>
              <Table>
                <thead>
                  <tr>
                    <Th>Person</Th>
                    <Th>Role</Th>
                    <Th>School</Th>
                    <Th>Class</Th>
                    <Th align="right">Joined</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <Td>
                        <span className="flex items-center gap-2.5">
                          <Avatar name={p.full_name || '?'} size={28} />
                          <span className="font-semibold text-ink">
                            {p.full_name || 'Unnamed'}
                          </span>
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={ROLE_TONE[p.role] || 'neutral'}>{p.role}</Badge>
                      </Td>
                      <Td>{p.school || '-'}</Td>
                      <Td>
                        {p.grade ? `Grade ${p.grade}${p.section || ''}` : p.class_name || '-'}
                      </Td>
                      <Td align="right" className="text-2xs">
                        {String(p.created_at || '').slice(0, 10)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              icon={Shield}
              title="No accounts listed"
              body="Either nobody has signed up yet, or this account does not have the admin role."
            />
          )}
        </>
      )}

      {tab === 'codes' && (
        <>
          <Callout tone="neutral" icon={KeyRound} className="mb-4">
            A teacher cannot self-register without a code. That is the difference
            between a login page and a login page anyone can walk through. Set a
            use limit when you hand a code to one person.
          </Callout>
          {codes.length ? (
            <Card flush>
              <Table>
                <thead>
                  <tr>
                    <Th>Code</Th>
                    <Th>School</Th>
                    <Th>Class</Th>
                    <Th align="right">Uses left</Th>
                    <Th align="right">Expires</Th>
                    <Th align="right"></Th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.code}>
                      <Td className="kc-tnum font-bold text-ink">{c.code}</Td>
                      <Td>{c.school || '-'}</Td>
                      <Td>
                        {c.grade ? `Grade ${c.grade}${c.section || ''}` : c.class_name || '-'}
                      </Td>
                      <Td align="right">{c.uses_left ?? 'Unlimited'}</Td>
                      <Td align="right" className="text-2xs">
                        {c.expires_at ? String(c.expires_at).slice(0, 10) : 'Never'}
                      </Td>
                      <Td align="right">
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Trash2}
                          onClick={async () => {
                            await deleteTeacherCode(c.code)
                            setToast({ message: `${c.code} removed.` })
                            reload()
                          }}
                        >
                          Revoke
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ) : (
            <EmptyState
              icon={KeyRound}
              title="No codes yet"
              body="Mint one per class, and give it to the teacher who will actually log."
              action={
                <Button variant="primary" icon={Plus} onClick={() => setCodeOpen(true)}>
                  New school code
                </Button>
              }
            />
          )}
        </>
      )}

      {/* ── Role modal ──────────────────────────────────── */}
      <Modal
        open={roleOpen}
        onClose={() => setRoleOpen(false)}
        title="Change someone's role"
        subtitle="The person must already have signed up. Roles take effect the next time they load the app."
        footer={
          <>
            <Button onClick={() => setRoleOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={busy}
              disabled={!roleForm.email.trim()}
              onClick={applyRole}
            >
              Apply
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Their email address" required>
            <Input
              type="email"
              value={roleForm.email}
              onChange={(e) => setRoleForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="rekha@school.edu.in"
            />
          </Field>
          <Field label="New role">
            <Select
              value={roleForm.role}
              onChange={(e) => setRoleForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="admin">Superadmin</option>
            </Select>
          </Field>
          <Callout tone="warn">
            A superadmin sees every child in every school and can change how the
            product behaves. Give it to as few people as possible.
          </Callout>
        </div>
      </Modal>

      {/* ── Code modal ──────────────────────────────────── */}
      <Modal
        open={codeOpen}
        onClose={() => setCodeOpen(false)}
        title="Mint a school code"
        footer={
          <>
            <Button onClick={() => setCodeOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={busy}
              disabled={!codeForm.code.trim()}
              onClick={applyCode}
            >
              Save code
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Code" hint="Short and sayable over a phone." required>
            <Input
              value={codeForm.code}
              onChange={(e) =>
                setCodeForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
              }
              placeholder="VIDYA-7C"
              className="kc-tnum tracking-wider"
            />
          </Field>
          <Field label="School">
            <Input
              value={codeForm.school}
              onChange={(e) => setCodeForm((f) => ({ ...f, school: e.target.value }))}
              placeholder={school?.name || 'Vidya Vihar Public School'}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Grade">
              <Select
                value={codeForm.grade}
                onChange={(e) => setCodeForm((f) => ({ ...f, grade: e.target.value }))}
              >
                <option value="">Any</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Section">
              <Select
                value={codeForm.section}
                onChange={(e) => setCodeForm((f) => ({ ...f, section: e.target.value }))}
              >
                <option value="">Any</option>
                {SECTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Uses" hint="Blank for unlimited">
              <Input
                type="number"
                min="1"
                value={codeForm.usesLeft}
                onChange={(e) => setCodeForm((f) => ({ ...f, usesLeft: e.target.value }))}
              />
            </Field>
          </div>
        </div>
      </Modal>

      <Toast toast={toast} />
    </AppShell>
  )
}
