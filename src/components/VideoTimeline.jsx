import { useMemo } from 'react'

function randomFrameType(seed) {
  const r = ((seed * 1103515245 + 12345) & 0x7fffffff) % 100
  if (r < 15) return 'fake'
  if (r < 40) return 'suspect'
  return 'clean'
}

const colorMap = {
  clean:   'bg-accent opacity-50',
  suspect: 'bg-warn opacity-80',
  fake:    'bg-accent3 opacity-90',
}

export default function VideoTimeline({ frames }) {
  // Accept live frames from API or generate demo frames
  const displayFrames = useMemo(() => {
    if (frames?.length) return frames
    return Array.from({ length: 96 }, (_, i) => ({
      frame: i + 1,
      type: randomFrameType(i * 31 + 7),
      score: 0,
    }))
  }, [frames])

  const totalSec = frames?.length
    ? Math.max(...frames.map(f => f.time_s))
    : 32

  const labels = Array.from({ length: 5 }, (_, i) =>
    `0:${String(Math.round(i * totalSec / 4)).padStart(2, '0')}`
  )

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">🎬 Frame-by-Frame Analysis</h3>
        <div className="flex gap-2">
          <span className="tag-vid">{displayFrames.length} FRAMES</span>
        </div>
      </div>

      <div className="flex h-12 gap-0.5 bg-bg3 rounded-lg p-1.5 overflow-hidden">
        {displayFrames.map((f, i) => (
          <div
            key={i}
            title={`Frame ${f.frame}: ${f.type} (${f.score?.toFixed(1)}%)`}
            className={`flex-1 rounded-sm min-w-[3px] cursor-pointer transition-transform hover:scale-y-110 ${colorMap[f.type]}`}
          />
        ))}
      </div>

      <div className="flex justify-between mono text-xs text-muted mt-2">
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>

      <div className="flex gap-5 mt-3">
        {[
          { color: 'bg-accent opacity-50',  label: 'Clean' },
          { color: 'bg-warn opacity-80',    label: 'Suspect' },
          { color: 'bg-accent3 opacity-90', label: 'Fake' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mono text-xs text-muted">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
