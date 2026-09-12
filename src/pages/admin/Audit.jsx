import React, { useEffect, useState } from 'react'
import { Activity, Download, RefreshCw } from 'lucide-react'
import AppShell from '../../components/AppShell.jsx'
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  SearchInput,
  Table,
  Td,
  Th,
} from '../../components/ui.jsx'
import { loadAuditLog } from '../../data/supabase.js'

const TONE = {
  signup: 'moss',
  set_role: 'accent',
  'roster.import': 'info',
  'student.archive': 'warn',
  'observation.delete': 'alert',
}

export default function AdminAudit() {
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = () => {
    setBusy(true)
    loadAuditLog(400)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setBusy(false))
  }

  useEffect(reload, [])

  const filtered = rows.filter((r) => {
    const n = query.trim().toLowerCase()
    if (!n) return true
    return `${r.action} ${r.entity} ${r.entity_id} ${JSON.stringify(r.detail || {})}`
      .toLowerCase()
      .includes(n)
  })

  const exportCsv = () => {
    const header = 'timestamp,actor_id,action,entity,entity_id,detail'
    const body = filtered
      .map((r) =>
        [
          r.created_at,
          r.actor_id || '',
          r.action,
          r.entity || '',
          r.entity_id || '',
          `"${JSON.stringify(r.detail || {}).replace(/"/g, "'")}"`,
        ].join(',')
      )
      .join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'kidchemy-audit.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <AppShell
      wide
      eyebrow="Superadmin"
      title="Audit trail"
      subtitle="Who did what, and when. This is children's data, so somebody will eventually ask."
      actions={
        <>
          <Button icon={RefreshCw} loading={busy} onClick={reload}>
            Refresh
          </Button>
          <Button icon={Download} onClick={exportCsv} disabled={!filtered.length}>
            Export
          </Button>
        </>
      }
    >
      <Callout tone="neutral" icon={Activity} className="mb-4">
        Signups, role changes, roster imports, and every create, edit and delete
        of an observation. Reads are not logged, because logging every parent
        opening their own child's page would be more surveillance than the
        product is willing to do.
      </Callout>

      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Action, entity or id"
        className="mb-4 w-full sm:w-80"
      />

      {filtered.length ? (
        <Card flush>
          <Table>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Reference</Th>
                <Th>Detail</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <Td className="kc-tnum whitespace-nowrap text-2xs">
                    {String(r.created_at).replace('T', ' ').slice(0, 16)}
                  </Td>
                  <Td>
                    <Badge tone={TONE[r.action] || 'neutral'}>{r.action}</Badge>
                  </Td>
                  <Td>{r.entity || '-'}</Td>
                  <Td className="kc-tnum text-2xs">{r.entity_id || '-'}</Td>
                  <Td className="max-w-xs truncate text-2xs">
                    {r.detail && Object.keys(r.detail).length
                      ? JSON.stringify(r.detail)
                      : '-'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          icon={Activity}
          title="Nothing logged yet"
          body="Entries appear as people sign up and teachers record observations."
        />
      )}
    </AppShell>
  )
}
