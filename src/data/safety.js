/* ══════════════════════════════════════════════════════════════════
   Child-safety and privacy checks that run in the browser.

   The database is the real wall (supabase/security.sql). These checks
   are the guard rail in front of it: they stop a well-meaning teacher
   from putting something into a shared note that should never be there.
   ══════════════════════════════════════════════════════════════════ */

// Sensitive categories. Each pattern is deliberately broad: a false
// warning costs a teacher two seconds, a missed one can follow a child.
const SENSITIVE = [
  {
    id: 'health',
    label: 'health or a diagnosis',
    re: /\b(adhd|add|autis\w*|asd|dyslexi\w*|dyspraxi\w*|dyscalculi\w*|ocd|bipolar|depress\w*|anxiety disorder|epilep\w*|asthma\w*|diabet\w*|medicat\w*|tablet[s]?|therap\w*|counsell?ing|psychiatr\w*|psycholog\w*|diagnos\w*|disorder|syndrome|special needs|learning disabilit\w*|cwsn|iep)\b/i,
    advice:
      'Health and diagnoses are sensitive personal data. Leave them out, or talk to the parent in person.',
  },
  {
    id: 'identity',
    label: 'caste, religion or community',
    re: /\b(caste|sc\/st|obc|dalit|brahmin|religio\w*|hindu|muslim|christian|sikh|jain|buddhist|parsi|church|mosque|temple|community quota)\b/i,
    advice:
      'Caste, religion and community have no place in a progress record. Please remove it.',
  },
  {
    id: 'family',
    label: 'family circumstances',
    re: /\b(divorc\w*|separated|custody|single (mother|father|parent)|alcohol\w*|drunk|beat(s|en|ing)?|abus\w*|neglect\w*|poor family|poverty|fees? (due|pending|not paid)|income|salary|unemploy\w*|jail|police)\b/i,
    advice:
      'Family circumstances belong with the school counsellor or principal, never in a shared note.',
  },
  {
    id: 'contact',
    label: 'contact details',
    re: /(\b\d{10}\b|\+91[\s-]?\d{5}[\s-]?\d{5}|[\w.+-]+@[\w-]+\.[\w.]+|\b(house|flat|plot) no\.?\s*\d+|\baadhaa?r\b|\b\d{4}\s?\d{4}\s?\d{4}\b)/i,
    advice:
      'Phone numbers, emails, addresses and ID numbers never go into an observation.',
  },
]

// Words that mean a child may be at risk. These are not observations at
// all; they go to the school's safeguarding lead the same day.
const SAFEGUARDING =
  /\b(hit(s)? (him|her|them)|bruis\w*|burn mark|touched (him|her) inappropriately|inappropriate(ly)? touch\w*|self[- ]harm|cut(s|ting)? (him|her)self|wants? to die|suicid\w*|scared to go home|sexual\w*|pocso|molest\w*|harass\w*|bully\w* (badly|every day)|runs? away from home)\b/i

/** Returns [{ id, label, advice }] for each sensitive category found. */
export function sensitiveFlags(...texts) {
  const text = texts.filter(Boolean).join('\n')
  if (!text.trim()) return []
  return SENSITIVE.filter((s) => s.re.test(text)).map(({ id, label, advice }) => ({
    id,
    label,
    advice,
  }))
}

export function safeguardingFlag(...texts) {
  const text = texts.filter(Boolean).join('\n')
  return SAFEGUARDING.test(text)
}

export const SAFEGUARDING_NOTE =
  'If you think a child may be unsafe, do not record it here. Tell your school’s designated safeguarding lead or principal today, in person. Under the POCSO Act 2012, suspected abuse must be reported to the police or the Special Juvenile Police Unit, and the school will help you do it.'

/** Only ever link to http(s). Blocks javascript:, data: and the rest. */
export function safeHref(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const u = new URL(url.trim(), window.location.origin)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null
  } catch {
    return null
  }
}

/** Unbiased random string from an alphabet, using the platform CSPRNG. */
export function randomFrom(alphabet, length) {
  const out = []
  const max = 256 - (256 % alphabet.length)
  const buf = new Uint8Array(length * 2)
  while (out.length < length) {
    crypto.getRandomValues(buf)
    for (const b of buf) {
      if (b < max) out.push(alphabet[b % alphabet.length])
      if (out.length === length) break
    }
  }
  return out.join('')
}

/** Download a JSON file in the browser (used for the parent's data export). */
export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
