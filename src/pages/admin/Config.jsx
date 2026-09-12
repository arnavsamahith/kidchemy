import React, { useEffect, useState } from 'react'
import { Info, Save, Settings, ShieldAlert } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  Badge,
  Button,
  Callout,
  Card,
  CardHead,
  Field,
  Input,
  Segmented,
  Select,
  Table,
  Tabs,
  Td,
  Th,
  Toast,
  useToast,
} from '../../components/ui.jsx'
import { useStore } from '../../data/store.jsx'
import { loadSettings, saveSetting } from '../../data/supabase.js'
import { TAG_GROUPS, ALL_TAGS, DIMENSIONS } from '../../data/taxonomy.js'
import { FRAMEWORKS, HPC_DOMAINS, HPC_LEVELS, DISPOSITIONS } from '../../data/pedagogy.js'

export default function AdminConfig() {
  const { setSettings } = useStore()
  const [toast, setToast] = useToast()
  const [tab, setTab] = useState('policy')
  const [cfg, setCfg] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadSettings()
      .then((c) => setCfg(c && Object.keys(c).length ? c : defaults()))
      .catch(() => setCfg(defaults()))
  }, [])

  function defaults() {
    return {
      branding: { productName: 'Kidchemy', tagline: 'A truer picture of every child' },
      terms: { periods: ['Term 1', 'Term 2', 'Term 3'], current: 'Term 1' },
      policy: {
        careerPathwaysMinGrade: 9,
        defaultVisibility: 'shared',
        watchTagsSchoolOnly: true,
        overdueDays: 21,
      },
    }
  }

  const patch = (key, part) =>
    setCfg((c) => ({ ...c, [key]: { ...(c?.[key] || {}), ...part } }))

  const save = async (key) => {
    setBusy(true)
    try {
      await saveSetting(key, cfg[key])
      setSettings({ [key]: cfg[key] })
      setToast({ message: 'Saved. Live for everyone on their next load.' })
    } catch {
      setToast({ message: 'Could not save. Check your admin role.', tone: 'alert' })
    } finally {
      setBusy(false)
    }
  }

  if (!cfg) {
    return (
      <AppShell title="Configuration">
        <Card>
          <p className="text-sm text-ink-faint">Loading settings.</p>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell
      wide
      eyebrow="Superadmin"
      title="Configuration"
      subtitle="Switches that change how the product behaves, without waiting for a deploy."
      tabs={
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'policy', label: 'Policy', icon: ShieldAlert },
            { value: 'terms', label: 'Terms and branding', icon: Settings },
            { value: 'taxonomy', label: 'Vocabulary', icon: Info, count: ALL_TAGS.length },
          ]}
        />
      }
    >
      {/* ── Policy ────────────────────────────────────────── */}
      {tab === 'policy' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead
              eyebrow="Safeguards"
              title="What the product will and will not say"
              subtitle="These are the decisions most likely to cause harm if they are wrong."
              actions={
                <Button
                  size="sm"
                  variant="primary"
                  icon={Save}
                  loading={busy}
                  onClick={() => save('policy')}
                >
                  Save
                </Button>
              }
            />
            <div className="space-y-4">
              <Field
                label="Show career pathways from grade"
                hint="Below this grade, parents see 'what to feed next' instead of career names. A career suggested at eleven becomes a label that sticks harder than a percentage."
              >
                <Select
                  value={cfg.policy?.careerPathwaysMinGrade ?? 9}
                  onChange={(e) =>
                    patch('policy', { careerPathwaysMinGrade: Number(e.target.value) })
                  }
                >
                  {[6, 7, 8, 9, 10, 11].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                  <option value={99}>Never show careers</option>
                </Select>
              </Field>

              <Field
                label="Default visibility for a new observation"
                hint="Shared means parents see it. School only keeps it with staff."
              >
                <Segmented
                  options={[
                    { value: 'shared', label: 'Shared with parents' },
                    { value: 'school', label: 'School only' },
                  ]}
                  value={cfg.policy?.defaultVisibility || 'shared'}
                  onChange={(v) => patch('policy', { defaultVisibility: v })}
                />
              </Field>

              <Field
                label="Growth edges default to school only"
                hint="Strongly recommended. A teacher who knows a parent reads every concern stops recording concerns, and the record dies without anyone noticing for a term."
              >
                <Segmented
                  options={[
                    { value: 'yes', label: 'Yes, keep concerns internal' },
                    { value: 'no', label: 'No, share everything' },
                  ]}
                  value={cfg.policy?.watchTagsSchoolOnly === false ? 'no' : 'yes'}
                  onChange={(v) => patch('policy', { watchTagsSchoolOnly: v === 'yes' })}
                />
              </Field>

              <Field
                label="Flag a child as overdue after"
                hint="Drives the 'not seen recently' nudge on the teacher's home page."
              >
                <Select
                  value={cfg.policy?.overdueDays ?? 21}
                  onChange={(e) => patch('policy', { overdueDays: Number(e.target.value) })}
                >
                  {[7, 14, 21, 28, 45].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <div className="space-y-4">
            <Callout tone="warn" icon={ShieldAlert} title="Before you loosen anything">
              Both of the defaults above exist because of a specific failure
              mode, not caution. Careers below Class 9 create labels. Visible
              concerns create self-censorship. Changing them is reasonable, but
              do it knowing which risk you are accepting.
            </Callout>

            <Card>
              <CardHead
                eyebrow="Reference"
                title="What the product is built on"
                subtitle="Read docs/PEDAGOGY.md for the full reasoning and sources."
              />
              <ul className="space-y-2.5">
                {Object.values(FRAMEWORKS).map((f) => (
                  <li key={f.id}>
                    <p className="text-sm font-bold text-ink">{f.label}</p>
                    <p className="text-sm text-ink-soft">{f.oneLine}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ── Terms and branding ────────────────────────────── */}
      {tab === 'terms' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHead
              eyebrow="Calendar"
              title="Terms"
              actions={
                <Button
                  size="sm"
                  variant="primary"
                  icon={Save}
                  loading={busy}
                  onClick={() => save('terms')}
                >
                  Save
                </Button>
              }
            />
            <div className="space-y-3">
              <Field
                label="Term names"
                hint="Comma separated, in order. Changing these does not rewrite existing observations."
              >
                <Input
                  value={(cfg.terms?.periods || []).join(', ')}
                  onChange={(e) =>
                    patch('terms', {
                      periods: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
              <Field label="Current term" hint="Pre-selected on every new observation.">
                <Select
                  value={cfg.terms?.current || ''}
                  onChange={(e) => patch('terms', { current: e.target.value })}
                >
                  {(cfg.terms?.periods || []).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <CardHead
              eyebrow="Naming"
              title="Branding"
              actions={
                <Button
                  size="sm"
                  variant="primary"
                  icon={Save}
                  loading={busy}
                  onClick={() => save('branding')}
                >
                  Save
                </Button>
              }
            />
            <div className="space-y-3">
              <Field label="Product name">
                <Input
                  value={cfg.branding?.productName || ''}
                  onChange={(e) => patch('branding', { productName: e.target.value })}
                />
              </Field>
              <Field label="Tagline" hint="Shown on the landing page and on stickers.">
                <Input
                  value={cfg.branding?.tagline || ''}
                  onChange={(e) => patch('branding', { tagline: e.target.value })}
                />
              </Field>
            </div>
          </Card>
        </div>
      )}

      {/* ── Vocabulary ────────────────────────────────────── */}
      {tab === 'taxonomy' && (
        <div className="space-y-4">
          <Callout tone="neutral" icon={Info}>
            The tag vocabulary lives in{' '}
            <code className="rounded bg-paper-2 px-1 py-0.5 text-xs">
              src/data/taxonomy.js
            </code>{' '}
            rather than the database, so that every change is reviewed and
            versioned. This page is the readable view of it, for showing a
            principal or a teacher what the product actually asks.
          </Callout>

          <Card flush>
            <div className="p-5 pb-0">
              <CardHead
                eyebrow="HPC mapping"
                title="How the vocabulary rolls into the five NEP domains"
              />
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Kidchemy dimension</Th>
                  <Th>HPC domain</Th>
                  <Th>What it means</Th>
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map((d) => (
                  <tr key={d.id}>
                    <Td className="font-bold text-ink">{d.label}</Td>
                    <Td>
                      <Badge tone="moss">
                        {HPC_DOMAINS.find((h) => h.id === d.hpc)?.label || d.hpc}
                      </Badge>
                    </Td>
                    <Td>{d.blurb}</Td>
                  </tr>
                ))}
                {DISPOSITIONS.map((d) => (
                  <tr key={d.id}>
                    <Td className="font-bold text-ink">
                      {d.label} <Badge tone="outline">disposition</Badge>
                    </Td>
                    <Td>
                      <Badge tone="moss">
                        {HPC_DOMAINS.find((h) => h.id === d.hpc)?.label || d.hpc}
                      </Badge>
                    </Td>
                    <Td>{d.blurb}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TAG_GROUPS.map((g) => (
              <Card key={g.id}>
                <div className="mb-2 flex items-center gap-2">
                  <p className="kc-eyebrow">{g.label}</p>
                  {g.watchGroup && <Badge tone="warn">Internal</Badge>}
                </div>
                <ul className="space-y-1">
                  {g.tags.map((t) => (
                    <li key={t.id} className="text-sm text-ink-soft">
                      {t.label}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <Card>
            <CardHead
              eyebrow="Progress levels"
              title="How judgement is recorded"
              subtitle="The published HPC rubric uses a landscape progression rather than marks."
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {HPC_LEVELS.map((l) => (
                <div key={l.id} className="rounded-[12px] border border-line p-4">
                  <p className="font-display text-lg font-semibold text-ink">
                    {l.label}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{l.gloss}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Toast toast={toast} />
    </AppShell>
  )
}
