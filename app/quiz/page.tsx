'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const C = {
  bg: '#02040a', panel: '#070d14', border: '#0d1e2e', borderHi: '#1a3448',
  purple: '#7c3aed', purpleHi: '#a78bfa', cyan: '#06b6d4', green: '#10b981',
  amber: '#f59e0b', red: '#ef4444', textHi: '#e8f4ff', textMid: '#6b8fa8', textLow: '#2a3f52',
  mono: '"Cascadia Code","Fira Code",monospace', sans: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
}

const PATTERNS = {
  guarded: {
    name: 'Guarded System', color: '#7c3aed', icon: '🛡️',
    tagline: 'Your body is in protection mode.',
    description: `Your nervous system has learned that tension equals safety. The problem is it never turns off — so you're spending enormous energy just to feel "normal." You're not weak or broken. Your body is doing exactly what it learned to do. We need to teach it something new.`,
    whatItMeans: ['Constantly bracing even at rest', 'Breathing feels restricted or shallow', 'Mentally exhausted from managing your body', 'Avoids certain movements "just in case"'],
    nextStep: 'The RESET phase targets your nervous system first — not the pain site. When your body stops bracing, everything else becomes possible.',
  },
  asymmetrical: {
    name: 'Asymmetrical System', color: '#06b6d4', icon: '⚖️',
    tagline: 'Your load is living on one side.',
    description: `One side of your body is doing most of the work — and the other has quietly checked out. This creates predictable, recurring problems on the overloaded side. It's not about stretching the tight side or strengthening the weak side. It's about restoring the conversation between both halves.`,
    whatItMeans: ['One hip sits higher or feels heavier', 'One shoulder sits forward or higher', 'Symptoms keep returning on the same side', 'Feels more stable or "at home" on one side'],
    nextStep: 'The REALIGN phase restores symmetry of load — so neither side compensates for the other. That\'s how recurring one-sided pain finally stops.',
  },
  overManaged: {
    name: 'Over-Managed System', color: '#f59e0b', icon: '🔄',
    tagline: "You've tried everything — and it keeps coming back.",
    description: `You're not doing the wrong things. You're doing the right things in the wrong order. Massage, physio, adjustments — they treat the output, not the input. When the underlying pattern isn't addressed first, the body resets to what it knows. That's why relief fades.`,
    whatItMeans: ['Multiple treatments tried — temporary relief only', 'Feels better after sessions but not in daily life', 'Symptoms return with stress or activity', 'Nothing has truly "stuck" long-term'],
    nextStep: 'We start earlier in the chain. Before treatment, before rehab — we identify what the body keeps resetting to, and change that first.',
  },
  glassCannon: {
    name: 'Glass Cannon', color: '#10b981', icon: '⚡',
    tagline: 'High output. Low resilience.',
    description: `You can train hard, push through, perform. But one bad session, one stressful week, one awkward movement — and you're back to square one. Your capacity has a ceiling your body never told you about. We build the foundation under the engine so it stops breaking down under load.`,
    whatItMeans: ['Active and disciplined but fragile', 'Breaks down from stress, not just injury', 'Recovery is inconsistent — sometimes great, sometimes terrible', 'Capacity feels unpredictable'],
    nextStep: 'The REBUILD phase builds genuine resilience — not just strength or mobility, but the nervous system\'s ability to handle real-world load without collapsing.',
  },
} as const

type PatternId = keyof typeof PATTERNS
type PatternScores = Record<PatternId, number>
type Option = { label: string; value: string; tags: string[]; patternScores: Partial<PatternScores> }
type QA = { question: string; answer: string; tags?: string[]; patternScores?: Partial<PatternScores> }
type Step = { question: string; subtext?: string; options: Option[]; source?: string; isEnd?: boolean }

function dominant(scores: PatternScores): PatternId {
  return (Object.entries(scores) as [PatternId, number][]).sort((a, b) => b[1] - a[1])[0][0]
}

export default function QuizPage() {
  const [step,    setStep]    = useState<Step | null>(null)
  const [history, setHistory] = useState<QA[]>([])
  const [scores,  setScores]  = useState<PatternScores>({ guarded: 0, asymmetrical: 0, overManaged: 0, glassCannon: 0 })
  const [loading, setLoading] = useState(true)
  const [chosen,  setChosen]  = useState<string | null>(null)
  const [phase,   setPhase]   = useState<'quiz' | 'result' | 'capture' | 'done'>('quiz')
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [whatsapp,setWhats]   = useState('')
  const [submitting, setSub]  = useState(false)

  useEffect(() => { fetchNext([], { guarded: 0, asymmetrical: 0, overManaged: 0, glassCannon: 0 }) }, [])

  async function fetchNext(hist: QA[], sc: PatternScores) {
    setLoading(true); setChosen(null)
    try {
      const res  = await fetch('/api/quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorSlug: 'dr-sportstherapy', history: hist, patternScores: sc }),
      })
      const data = await res.json()
      if (data.isEnd) { setPhase('result') }
      else { setStep(data) }
    } catch { setStep({ question: 'Something went wrong. Please refresh.', options: [] }) }
    setLoading(false)
  }

  async function choose(opt: Option) {
    setChosen(opt.value)
    await new Promise(r => setTimeout(r, 300))
    const addScores = opt.patternScores || {}
    const newScores: PatternScores = {
      guarded:      (scores.guarded      || 0) + (addScores.guarded      || 0),
      asymmetrical: (scores.asymmetrical || 0) + (addScores.asymmetrical || 0),
      overManaged:  (scores.overManaged  || 0) + (addScores.overManaged  || 0),
      glassCannon:  (scores.glassCannon  || 0) + (addScores.glassCannon  || 0),
    }
    const newHist: QA[] = [...history, { question: step!.question, answer: opt.value, tags: opt.tags, patternScores: opt.patternScores }]
    setScores(newScores); setHistory(newHist)
    fetchNext(newHist, newScores)
  }

  async function submitLead() {
    if (!name.trim() || !email.trim()) return
    setSub(true)
    const pattern = dominant(scores)
    await supabase.from('quiz_leads').insert({
      doctor_slug: 'dr-sportstherapy',
      name: name.trim(), email: email.trim(),
      whatsapp: whatsapp.trim() || null,
      score: Math.max(...Object.values(scores)),
      answers: Object.fromEntries(history.map((h, i) => [`q${i + 1}`, h.answer])),
      path_taken: history.map(h => h.answer),
      metadata: { pattern, patternScores: scores },
    })
    setSub(false); setPhase('done')
  }

  const progress   = Math.min(history.length / 8, 0.95)
  const pattern    = dominant(scores)
  const patternDef = PATTERNS[pattern]

  if (phase === 'done') return (
    <Shell>
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>✅</div>
        <h1 style={{ fontSize: 22, color: C.textHi, marginBottom: 10, fontWeight: 700 }}>You're on Diego's list</h1>
        <p style={{ color: C.textMid, fontSize: 14, lineHeight: 1.65, maxWidth: 360, margin: '0 auto 24px' }}>
          He'll review your <strong style={{ color: patternDef.color }}>{patternDef.name}</strong> profile personally and reach out within 24 hours.
        </p>
        <a href="https://drsportstherapy.com" style={{ display: 'inline-block', background: patternDef.color, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600 }}>
          Visit DrSportsTherapy →
        </a>
      </div>
    </Shell>
  )

  if (phase === 'capture') return (
    <Shell>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${patternDef.color}15`, border: `0.5px solid ${patternDef.color}40`, borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 16 }}>{patternDef.icon}</span>
          <span style={{ fontSize: 11, color: patternDef.color, fontFamily: C.mono }}>{patternDef.name}</span>
        </div>
        <h2 style={{ fontSize: 20, color: C.textHi, marginBottom: 8, fontWeight: 700 }}>Where should Diego send your assessment?</h2>
        <p style={{ color: C.textMid, fontSize: 13, lineHeight: 1.55 }}>He reviews every profile personally before reaching out.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {([
          { label: 'Your name *',         val: name,     set: setName,  ph: 'First name',      type: 'text'  },
          { label: 'Email address *',     val: email,    set: setEmail, ph: 'you@email.com',   type: 'email' },
          { label: 'WhatsApp (optional)', val: whatsapp, set: setWhats, ph: '+44 7XXX XXXXXX', type: 'tel'   },
        ] as const).map(f => (
          <div key={f.label}>
            <label style={{ fontSize: 11, color: C.textMid, fontFamily: C.mono, display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              style={{ width: '100%', background: C.panel, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '13px 14px', color: C.textHi, fontSize: 14, outline: 'none' }} />
          </div>
        ))}
        <button onClick={submitLead} disabled={submitting || !name.trim() || !email.trim()}
          style={{ marginTop: 4, background: submitting ? C.border : patternDef.color, border: 'none', borderRadius: 10, padding: '15px', color: 'white', fontSize: 15, fontWeight: 700, cursor: !name.trim() || !email.trim() ? 'default' : 'pointer', opacity: !name.trim() || !email.trim() ? 0.4 : 1 }}>
          {submitting ? 'Sending…' : 'Send my profile to Diego →'}
        </button>
      </div>
    </Shell>
  )

  if (phase === 'result') return (
    <Shell>
      <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${patternDef.color}15`, border: `0.5px solid ${patternDef.color}40`, borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 14 }}>{patternDef.icon}</span>
          <span style={{ fontSize: 10, color: patternDef.color, fontFamily: C.mono, letterSpacing: '0.12em' }}>PRIMARY PATTERN</span>
        </div>
        <h1 style={{ fontSize: 28, color: C.textHi, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{patternDef.name}</h1>
        <p style={{ fontSize: 16, color: patternDef.color, fontWeight: 600, marginBottom: 16 }}>{patternDef.tagline}</p>
        <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7 }}>{patternDef.description}</p>
      </div>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, color: C.textLow, fontFamily: C.mono, letterSpacing: '0.12em', marginBottom: 14 }}>WHAT THIS MEANS FOR YOU</p>
        {patternDef.whatItMeans.map((point, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: patternDef.color, marginTop: 7, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5, margin: 0 }}>{point}</p>
          </div>
        ))}
      </div>
      <div style={{ background: C.panel, border: `0.5px solid ${patternDef.color}30`, borderLeft: `3px solid ${patternDef.color}`, borderRadius: '0 10px 10px 0', padding: '16px 18px', marginBottom: 28 }}>
        <p style={{ fontSize: 10, color: C.textLow, fontFamily: C.mono, letterSpacing: '0.1em', marginBottom: 8 }}>DIEGO'S APPROACH FOR THIS PATTERN</p>
        <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65, margin: 0 }}>{patternDef.nextStep}</p>
      </div>
      <button onClick={() => setPhase('capture')}
        style={{ width: '100%', background: patternDef.color, border: 'none', borderRadius: 10, padding: '16px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        Get Diego's assessment of my {patternDef.name} →
      </button>
    </Shell>
  )

  return (
    <Shell>
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <span style={{ fontSize: 10, color: C.textLow, fontFamily: C.mono, letterSpacing: '0.1em' }}>DR. SPORTSTHERAPY — MOVEMENT DIAGNOSTIC</span>
          {step?.source === 'ai' && <span style={{ fontSize: 9, color: C.purple, fontFamily: C.mono }}>◈ AI</span>}
        </div>
        <div style={{ height: 2, background: C.border, borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg,${C.purple},${C.cyan})`, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 52, background: C.panel, borderRadius: 10, opacity: 1 - i * 0.15 }} />)}
        </div>
      ) : step ? (
        <>
          <h2 style={{ fontSize: 21, color: C.textHi, lineHeight: 1.35, marginBottom: step.subtext ? 10 : 24, fontWeight: 700 }}>{step.question}</h2>
          {step.subtext && <p style={{ fontSize: 13, color: C.textMid, marginBottom: 22, lineHeight: 1.55 }}>{step.subtext}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {step.options.map(opt => {
              const isChosen = chosen === opt.value
              const optPattern = opt.patternScores ? (Object.entries(opt.patternScores) as [PatternId, number][]).sort((a,b) => b[1]-a[1])[0]?.[0] : null
              const hoverCol = optPattern ? PATTERNS[optPattern as PatternId]?.color : C.purple
              return (
                <button key={opt.value} onClick={() => !chosen && choose(opt)}
                  style={{ background: isChosen ? `${hoverCol}20` : C.panel, border: `0.5px solid ${isChosen ? hoverCol : C.border}`, borderRadius: 10, padding: '15px 18px', color: C.textHi, fontSize: 14, cursor: chosen ? 'default' : 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${isChosen ? hoverCol : C.textLow}`, background: isChosen ? hoverCol : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white' }}>
                    {isChosen ? '✓' : ''}
                  </div>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </>
      ) : null}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '36px 20px' }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0 } body { background:${C.bg} } input::placeholder { color:${C.textLow} } button { font-family:${C.sans} }`}</style>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.purple, boxShadow: `0 0 10px ${C.purple}` }} />
          <span style={{ fontSize: 12, color: C.textMid, fontFamily: C.mono, letterSpacing: '0.12em' }}>DR. SPORTSTHERAPY</span>
        </div>
        {children}
      </div>
    </div>
  )
}
