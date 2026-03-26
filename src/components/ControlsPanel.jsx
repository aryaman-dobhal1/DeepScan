import { useState } from 'react'
import { Settings } from 'lucide-react'

const modules = [
  { key: 'gan',      label: 'GAN Artifact Detection',   default: true },
  { key: 'landmark', label: 'Facial Landmark Analysis',  default: true },
  { key: 'fft',      label: 'Frequency Domain (FFT)',    default: true },
  { key: 'meta',     label: 'Metadata Forensics',        default: true },
  { key: 'lipsync',  label: 'Lip Sync Mismatch',         default: false },
  { key: 'audio',    label: 'Voice Clone Detection',      default: false },
]

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 flex-shrink-0
                  ${on ? 'bg-accent' : 'bg-border2'}`}
      style={{ height: '22px', width: '40px' }}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200
                    ${on ? 'translate-x-[19px]' : 'translate-x-[3px]'}`}
      />
    </button>
  )
}

export default function ControlsPanel({ settings, onChange }) {
  const [mods, setMods] = useState(
    Object.fromEntries(modules.map(m => [m.key, m.default]))
  )

  const toggleMod = (key) => {
    const next = { ...mods, [key]: !mods[key] }
    setMods(next)
    onChange?.({ ...settings, modules: next })
  }

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2 mono text-xs text-muted uppercase tracking-widest
                      border-b border-border pb-3">
        <Settings size={12} />
        Analysis Settings
      </div>

      {/* Model select */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">Detection Model</label>
        <select
          className="bg-bg3 border border-border2 rounded-lg text-white px-3 py-2
                     text-sm mono cursor-pointer outline-none focus:border-accent transition-colors"
          value={settings?.model}
          onChange={e => onChange?.({ ...settings, model: e.target.value })}
        >
          <option value="efficientnet">EfficientNet-B7 (Default)</option>
          <option value="xception">XceptionNet</option>
          <option value="ensemble">Ensemble (Best Accuracy)</option>
          <option value="mesonet">MesoNet (Fastest)</option>
        </select>
      </div>

      {/* Sensitivity slider */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold">Sensitivity Threshold</label>
          <span className="mono text-xs text-accent">{settings?.sensitivity ?? 72}%</span>
        </div>
        <input
          type="range" min="0" max="100"
          value={settings?.sensitivity ?? 72}
          onChange={e => onChange?.({ ...settings, sensitivity: +e.target.value })}
        />
        <div className="flex justify-between mono text-xs text-muted">
          <span>Low (more misses)</span>
          <span>High (more flags)</span>
        </div>
      </div>

      {/* Module toggles */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold mb-1">Active Modules</label>
        {modules.map(m => (
          <div key={m.key} className="flex items-center justify-between">
            <span className="mono text-xs text-muted">{m.label}</span>
            <Toggle on={mods[m.key]} onToggle={() => toggleMod(m.key)} />
          </div>
        ))}
      </div>
    </div>
  )
}
