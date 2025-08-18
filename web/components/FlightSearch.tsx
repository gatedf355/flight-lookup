'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchFlight } from '@/lib/api'
import clsx from 'clsx'
import { DateTime } from 'luxon'
import { RawJsonDialog } from './RawJsonDialog'

type FlightData = any

function asAgo(input?: string | number | null) {
  if (!input) return ''
  const ms = typeof input === 'number'
    ? (input > 1e12 ? input : input * 1000)
    : Date.parse(input)
  if (!Number.isFinite(ms)) return ''
  const diff = DateTime.fromMillis(ms).toRelative({ base: DateTime.now() })
  return diff ?? ''
}

function pick(obj: any, keys: string[], fallback?: any) {
  if (!obj) return fallback
  for (const k of keys) {
    if (k in obj && obj[k] != null) return obj[k]
  }
  return fallback
}

export default function FlightSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FlightData | null>(null)
  const [lowCost, setLowCost] = useState(false)
  const lastQueryRef = useRef<string>('')

  const friendlyError = useMemo(() => {
    if (!error) return null
    if (/HTTP\s*404/.test(error)) return 'Flight not found or inactive'
    if (/HTTP\s*(401|403)/.test(error)) return 'Auth problem with flight data service'
    if (/HTTP\s*429/.test(error)) return 'Rate limited—please wait a bit'
    return error
  }, [error])

  const doFetch = useCallback(async (q: string) => {
    if (!q.trim()) return
    try {
      setLoading(true)
      setError(null)
      const json = await fetchFlight(q)
      setData(json)
      lastQueryRef.current = q
    } catch (e: any) {
      setData(null)
      setError(e?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (lowCost) return
    if (!lastQueryRef.current) return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      doFetch(lastQueryRef.current)
    }, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [lowCost, doFetch])

  const progress = typeof pick(data, ['progressPercent']) === 'number'
    ? Math.max(0, Math.min(100, Number((data as any).progressPercent)))
    : null

  const summary = (data as any)?.summary || {}
  const lp = (data as any)?.lastPosition || (data as any)?.position || (data as any)?.last_position

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter flight number (AC123) or callsign"
          className="min-w-0 flex-1 px-3 py-2 rounded-md border bg-transparent"
        />
        <button
          onClick={() => doFetch(query)}
          disabled={loading || !query.trim()}
          className={clsx('px-4 py-2 rounded-md border', loading && 'opacity-60')}
        >
          {loading ? 'Loading…' : 'Search'}
        </button>
        <label className="flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer">
          <input
            type="checkbox"
            checked={lowCost}
            onChange={e => setLowCost(e.target.checked)}
          />
          Low-cost mode
        </label>
        <RawJsonDialog data={data} />
      </div>

      {!query.trim() && !loading && !data && !error && (
        <p className="text-sm text-zinc-500">Enter a flight number or callsign</p>
      )}

      {friendlyError && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
          {friendlyError}
        </div>
      )}

      {progress != null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div className="h-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="rounded-md border p-3">
            <div className="text-sm">
              <div><span className="font-medium">Callsign:</span> {summary.callsign ?? summary.number ?? '—'}</div>
              <div><span className="font-medium">Status:</span> {summary.status ?? '—'}</div>
              <div><span className="font-medium">Route:</span> {(summary.orig_icao || summary.origin) ?? '—'} → {(summary.dest_icao || summary.destination) ?? '—'}</div>
            </div>
          </div>

          {lp && (
            <div className="rounded-md border p-3 text-sm grid grid-cols-2 gap-3">
              <div><span className="font-medium">Lat/Lon:</span> {pick(lp, ['lat','latitude'],'—')}, {pick(lp, ['lon','lng','longitude'],'—')}</div>
              <div><span className="font-medium">Alt:</span> {pick(lp, ['alt','altitude'],'—')}</div>
              <div><span className="font-medium">GS:</span> {pick(lp, ['gs','groundSpeed'],'—')}</div>
              <div><span className="font-medium">VS:</span> {pick(lp, ['vs','verticalSpeed'],'—')}</div>
              <div><span className="font-medium">Track:</span> {pick(lp, ['track','heading'],'—')}</div>
              <div><span className="font-medium">Time:</span> {asAgo(pick(lp, ['time','timestamp','ts','timeMs','timeSec']))}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
