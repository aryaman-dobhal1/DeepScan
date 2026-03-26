import { useEffect, useRef, useState } from 'react'

export default function VerdictRing({ score }) {
  const [displayed, setDisplayed] = useState(0)
  const r = 58
  const circ = 2 * Math.PI * r

  useEffect(() => {
    setDisplayed(0)
    let cur = 0
    const target = score
    const t = setInterval(() => {
      cur = Math.min(cur + 2, target)
      setDisplayed(cur)
      if (cur >= target) clearInterval(t)
    }, 20)
    return () => clearInterval(t)
  }, [score])

  const isFake = score >= 50
  const color  = isFake ? '#ff4f7b' : '#00f5c4'
  const offset = circ - (circ * displayed / 100)

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#252a50" strokeWidth="8" />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tighter" style={{ color }}>
            {displayed}%
          </span>
          <span className="mono text-xs text-muted">FAKE PROB.</span>
        </div>
      </div>

      <div
        className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-extrabold text-base tracking-widest
                    ${isFake
                      ? 'bg-accent3/10 text-accent3 border border-accent3/30'
                      : 'bg-accent/10  text-accent  border border-accent/25'}`}
      >
        {isFake ? '⚠ DEEPFAKE DETECTED' : '✓ AUTHENTIC'}
      </div>

      <p className="mono text-xs text-muted text-center leading-relaxed">
        Analyzed 187 facial landmarks<br />across 3 detection models
      </p>
    </div>
  )
}
