import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM = `You are the intake assessment engine for DrSportsTherapy — Diego Robinson's sports therapy practice.

You ask smart, sequential questions to identify which of four movement patterns a person has:
- guarded: nervous system in protection mode, constant tension
- asymmetrical: load imbalance, one-sided recurring issues
- overManaged: tried everything, temporary relief only, nothing sticks
- glassCannon: high performer but fragile, breaks down unpredictably

Rules:
- Ask ONE question at a time, max 8 questions total
- Each question must have 3-4 answer options
- Options must carry patternScores (partial, not all patterns need a score)
- After 6-8 questions when you have enough signal, set isEnd: true
- Questions should feel like a conversation, not a medical form
- Use plain language, no jargon

Always respond with valid JSON only:
{
  "question": "...",
  "subtext": "..." or null,
  "isEnd": false,
  "options": [
    {
      "label": "...",
      "value": "unique-slug",
      "tags": ["tag1"],
      "patternScores": { "guarded": 2 }
    }
  ]
}

When isEnd is true, return: { "isEnd": true }`

export async function POST(req: NextRequest) {
  const { history = [], patternScores = {} } = await req.json()

  // End after 7+ questions or clear dominant pattern
  const scores = Object.values(patternScores as Record<string, number>)
  const maxScore = Math.max(...scores, 0)
  const total = scores.reduce((a, b) => a + b, 0)

  if (history.length >= 7 || (history.length >= 5 && maxScore >= 8 && maxScore / (total || 1) > 0.5)) {
    return NextResponse.json({ isEnd: true })
  }

  const historyText = history.length > 0
    ? `\n\nAnswers so far:\n${history.map((h: any, i: number) => `Q${i+1}: ${h.question}\nA: ${h.answer}`).join('\n\n')}`
    : ''

  const scoreText = `\nCurrent pattern scores: ${JSON.stringify(patternScores)}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content: `Generate the next assessment question.${historyText}${scoreText}\n\nQuestions asked so far: ${history.length}. Generate question ${history.length + 1}.`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}') + 1
    const data = JSON.parse(text.slice(start, end))

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({
      question: "How would you describe the main issue you're dealing with right now?",
      subtext: null,
      isEnd: false,
      options: [
        { label: "Constant tension or pain that never fully goes away", value: "constant-tension", tags: ["pain"], patternScores: { guarded: 2 } },
        { label: "It's always on one side — same spot, keeps coming back", value: "one-side", tags: ["asymmetry"], patternScores: { asymmetrical: 2 } },
        { label: "I've tried loads of things but nothing seems to stick", value: "tried-everything", tags: ["history"], patternScores: { overManaged: 2 } },
        { label: "I'm active and capable but I keep breaking down unexpectedly", value: "breaks-down", tags: ["performance"], patternScores: { glassCannon: 2 } },
      ],
    })
  }
}
