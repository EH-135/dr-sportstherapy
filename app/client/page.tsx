'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const C = {
  bg: '#02040a', panel: '#070d14', border: '#0d1e2e', borderHi: '#1a3448',
  purple: '#7c3aed', cyan: '#06b6d4', green: '#10b981', amber: '#f59e0b',
  textHi: '#e8f4ff', textMid: '#6b8fa8', textLow: '#2a3f52',
  mono: '"Cascadia Code","Fira Code",monospace', sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
}

const PATTERN_COLORS: Record<string, string> = {
  guarded: '#7c3aed', asymmetrical: '#06b6d4', overManaged: '#f59e0b', glassCannon: '#10b981',
}
const PATTERN_ICONS: Record<string, string> = {
  guarded: '🛡️', asymmetrical: '⚖️', overManaged: '🔄', glassCannon: '⚡',
}
const PATTERN_NAMES: Record<string, string> = {
  guarded: 'Guarded System', asymmetrical: 'Asymmetrical System',
  overManaged: 'Over-Managed System', glassCannon: 'Glass Cannon',
}

const ACCESS_CODE = process.env.NEXT_PUBLIC_CLIENT_ACCESS_CODE || 'DIEGO2026'

type Lead = {
  id: string
  name: string
  email: string
  whatsapp: string | null
  score: number
  metadata: { pattern: string; patternScores: Record<string, number> }
  created_at: string
}

export default function ClientPortal() {
  const supabaseRef = useRef<SupabaseClient | null>(null)
  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    return supabaseRef.current
  }

  const [authed, setAuthed] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  function login() {
    if (code.trim().toUpperCase() === ACCESS_CODE.toUpperCase()) {
      setAuthed(true)
      setError('')
    } else {
      setError('Incorrect access code')
    }
  }

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    getSupabase()
      .from('quiz_leads')
      .select('*')
      .eq('doctor_slug', 'dr-sportstherapy')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [authed])

  const now = new Date()
  const thisMonth = leads.filter(l => {
    const d = new Date(l.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisWeek = leads.filter(l => {
    const d = new Date(l.created_at)
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
  })
  const withWhatsApp = leads.filter(l => l.whatsapp)

  function timeAgo(iso: string) {
    const diff = (now.getTime() - new Date(iso).getTime()) / 1000
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (!authed) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: C.sans }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.purple, boxShadow: `0 0 10px ${C.purple}` }} />
          <span style={{ fontSize: 12, color: C.textMid, fontFamily: C.mono, letterSpacing: '0.12em' }}>DR. SPORTSTHERAPY — CLIENT PORTAL</span>
        </div>
        <h1 style={{ fontSize: 22, color: C.textHi, fontWeight: 700, marginBottom: 8 }}>Your leads dashboard</h1>
        <p style={{ fontSize: 14, color: C.textMid, marginBottom: 28, lineHeight: 1.55 }}>Enter your access code to view quiz completions.</p>
        <input
          type="password" value={code} onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Access code"
          style={{ width: '100%', background: C.panel, border: `0.5px solid ${error ? '#ef4444' : C.border}`, borderRadius: 10, padding: '13px 14px', color: C.textHi, fontSize: 14, outline: 'none', fontFamily: C.sans, marginBottom: 8 }}
        />
        {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{error}</p>}
        <button onClick={login}
          style={{ width: '100%', background: C.purple, border: 'none', borderRadius: 10, padding: '14px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: C.sans }}>
          Enter portal →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '36px 20px', fontFamily: C.sans }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.purple, boxShadow: `0 0 10px ${C.purple}` }} />
          <span style={{ fontSize: 12, color: C.textMid, fontFamily: C.mono, letterSpacing: '0.12em' }}>DR. SPORTSTHERAPY — LEADS</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
          {[
            { label: 'Total', value: leads.length, color: C.purple },
            { label: 'This month', value: thisMonth.length, color: C.cyan },
            { label: 'This week', value: thisWeek.length, color: C.green },
            { label: 'WhatsApp', value: withWhatsApp.length, color: C.amber },
          ].map(s => (
            <div key={s.label} style={{ background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: C.mono }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.textLow, marginTop: 4, letterSpacing: '0.08em' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && leads.length === 0 && (
          <div style={{ background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: C.textMid, marginBottom: 16 }}>No leads yet — share your quiz link to start getting completions.</p>
            <div style={{ background: C.bg, border: `0.5px solid ${C.borderHi}`, borderRadius: 8, padding: '10px 16px', display: 'inline-block' }}>
              <span style={{ fontSize: 12, color: C.textMid, fontFamily: C.mono }}>dr-sportstherapy.vercel.app/quiz</span>
            </div>
          </div>
        )}

        {/* Leads list */}
        {loading && <div style={{ color: C.textLow, fontSize: 14, textAlign: 'center', padding: 40 }}>Loading...</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leads.map(lead => {
            const pattern = lead.metadata?.pattern || 'guarded'
            const color = PATTERN_COLORS[pattern] || C.purple
            const isOpen = expanded === lead.id
            return (
              <div key={lead.id}
                onClick={() => setExpanded(isOpen ? null : lead.id)}
                style={{ background: C.panel, border: `0.5px solid ${isOpen ? color : C.border}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {PATTERN_ICONS[pattern]}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, color: C.textHi, fontWeight: 600 }}>{lead.name}</div>
                      <div style={{ fontSize: 11, color: color, fontFamily: C.mono, marginTop: 2 }}>{PATTERN_NAMES[pattern]}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: C.textLow, fontFamily: C.mono }}>{timeAgo(lead.created_at)}</span>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `0.5px solid ${C.border}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMid, textDecoration: 'none', fontSize: 13 }}>
                        <span style={{ color: C.textLow }}>✉</span> {lead.email}
                      </a>
                      {lead.whatsapp && (
                        <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.green, textDecoration: 'none', fontSize: 13 }}>
                          <span>📱</span> {lead.whatsapp}
                        </a>
                      )}
                    </div>
                    {lead.metadata?.patternScores && (
                      <div style={{ marginTop: 14 }}>
                        <p style={{ fontSize: 10, color: C.textLow, fontFamily: C.mono, letterSpacing: '0.1em', marginBottom: 8 }}>PATTERN BREAKDOWN</p>
                        {Object.entries(lead.metadata.patternScores).sort((a,b) => b[1]-a[1]).map(([pid, s]) => {
                          const max = Math.max(...Object.values(lead.metadata.patternScores))
                          const pct = Math.round((s / (max || 1)) * 100)
                          return (
                            <div key={pid} style={{ marginBottom: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: pid === pattern ? PATTERN_COLORS[pid] : C.textLow }}>{PATTERN_NAMES[pid]}</span>
                                <span style={{ fontSize: 10, color: C.textLow, fontFamily: C.mono }}>{s}</span>
                              </div>
                              <div style={{ height: 2, background: C.border, borderRadius: 2 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: pid === pattern ? PATTERN_COLORS[pid] : C.borderHi, borderRadius: 2 }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
