import { useEffect, useState } from 'react'

const SIGNAL_DEFS = [
  { key: 'gan_artifact',          label: 'GAN Artifact Score',     type: 'danger' },
  { key: 'facial_inconsistency',  label: 'Facial Inconsistency',   type: 'danger' },
  { key: 'blink_anomaly',         label: 'Blinking Anomaly',       type: 'warn' },
  { key: 'skin_texture',          label: 'Skin Texture Coherence', type: 'ok' },
  { key: 'frequency_shift',       label: 'Frequency Domain Shift', type: 'warn' },
  { key: 'metadata_auth',         label: 'Metadata Authenticity',  type: 'danger' },
]

const DEMO_VALUES = {
  gan_artifact: 94, facial_inconsistency: 88, blink_anomaly: 61,
  skin_texture: 23, frequency_shift: 74, metadata_auth: 91,
}

const colorMap = {
  danger: 'from-accent3 to-rose-400',
  warn:   'from-warn to-yellow-300',
  ok:     'from-accent to-emerald-300',
}

export default function MetricBars({ animate, values }) {
  const source = values || DEMO_VALUES
  const [widths, setWidths] = useState(SIGNAL_DEFS.map(() => 0))

  useEffect(() => {
    if (!animate) return
    SIGNAL_DEFS.forEach((s, i) => {
      setTimeout(() => {
        setWidths(w => {
          const next = [...w]
          next[i] = source[s.key] ?? 0
          return next
        })
      }, i * 130 + 200)
    })
  }, [animate, source.gan_artifact]) // eslint-disable-line

  return (
    <div className="flex flex-col gap-4">
      {SIGNAL_DEFS.map((s, i) => (
        <div key={s.key}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-semibold">{s.label}</span>
            <span className="mono text-muted">{widths[i].toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-border2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colorMap[s.type]}
                          transition-all duration-[1200ms] ease-out`}
              style={{ width: `${widths[i]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
