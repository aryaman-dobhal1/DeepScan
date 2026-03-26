import { useEffect, useState } from 'react'

const steps = [
  '⚡ Preprocessing media frames...',
  '🧠 Running EfficientNet-B7 model...',
  '🎭 Facial landmark extraction (187 pts)...',
  '🔬 GAN artifact frequency analysis...',
  '📊 Aggregating confidence scores...',
  '✅ Generating forensic report...',
]

export default function AnalysisLoader({ visible }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!visible) { setActive(0); return }
    const t = setInterval(() => setActive(a => Math.min(a + 1, steps.length - 1)), 550)
    return () => clearInterval(t)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6">
      {/* Spinning ring */}
      <div className="relative w-20 h-20">
        <div className="w-full h-full rounded-full border-2 border-border2 border-t-accent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
      </div>

      <div className="flex flex-col gap-2 mono text-sm">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`transition-all duration-400 flex items-center gap-2
              ${i < active  ? 'text-accent opacity-100' :
                i === active ? 'text-white opacity-100' :
                               'text-muted opacity-30'}`}
          >
            <span>{i < active ? '✓' : i === active ? '›' : '·'}</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}
