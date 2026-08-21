import { useRef, useState } from 'react'
import { useStudio } from '../../state/StudioContext'
import { fetchSheetCsv, parseJsonRoster } from '../../lib/dataSource'
import { Badge, Button, Card, Label, Select, TextArea, TextInput } from '../../components/ui'
import type { DataSourceMode } from '../../types'

export default function DataSourceTab() {
  const { state, patch, set } = useStudio()
  const ds = state.dataSource
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadJson = (text: string) => {
    try {
      const rows = parseJsonRoster(text)
      set('rosterData', rows)
      patch('dataSource', { jsonText: text, lastFetchedAt: Date.now(), lastError: null })
    } catch (err) {
      patch('dataSource', { lastError: err instanceof Error ? err.message : String(err) })
    }
  }

  const fetchSheet = async () => {
    setBusy(true)
    try {
      const rows = await fetchSheetCsv(ds.sheetCsvUrl)
      set('rosterData', rows)
      patch('dataSource', { lastFetchedAt: Date.now(), lastError: null })
    } catch (err) {
      patch('dataSource', { lastError: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  const columns = state.rosterData.length > 0 ? Object.keys(state.rosterData[0]) : []

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div>
          <Label>Source</Label>
          <Select value={ds.mode} onChange={(e) => patch('dataSource', { mode: e.target.value as DataSourceMode })}>
            <option value="none">None</option>
            <option value="json">JSON file / paste</option>
            <option value="sheet">Google Sheet (published CSV)</option>
          </Select>
        </div>

        {ds.mode === 'json' && (
          <div className="space-y-2">
            <Label>Paste JSON — an array of objects, e.g. [{'{'}"name":"J. Smith","carries":"12","yards":"84"{'}'}]</Label>
            <TextArea rows={6} value={ds.jsonText} onChange={(e) => patch('dataSource', { jsonText: e.target.value })} />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={() => loadJson(ds.jsonText)}>
                Load pasted JSON
              </Button>
              <Button
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                Upload .json file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  loadJson(await file.text())
                }}
              />
            </div>
          </div>
        )}

        {ds.mode === 'sheet' && (
          <div className="space-y-2">
            <Label>Published CSV URL (Google Sheets → File → Share → Publish to web → CSV)</Label>
            <TextInput placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?output=csv" value={ds.sheetCsvUrl} onChange={(e) => patch('dataSource', { sheetCsvUrl: e.target.value })} />
            <Button variant="primary" size="sm" onClick={fetchSheet} disabled={busy || !ds.sheetCsvUrl}>
              {busy ? 'Fetching…' : 'Fetch now'}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 text-xs">
          {ds.lastError && <Badge tone="bad">{ds.lastError}</Badge>}
          {!ds.lastError && ds.lastFetchedAt && <Badge tone="good">Loaded {state.rosterData.length} rows</Badge>}
        </div>
      </Card>

      {state.rosterData.length > 0 && (
        <Card className="overflow-x-auto p-4">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} className="border-b border-[var(--color-border)] px-2 py-1.5 font-semibold text-[var(--color-text-muted)]">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.rosterData.slice(0, 8).map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} className="border-b border-[var(--color-border)] px-2 py-1.5 text-[var(--color-text)]">
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {state.rosterData.length > 8 && (
            <p className="mt-2 text-xs text-[var(--color-text-dim)]">…and {state.rosterData.length - 8} more rows</p>
          )}
        </Card>
      )}
    </div>
  )
}
