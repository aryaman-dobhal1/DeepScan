import { useEffect, useState } from 'react'

export default function HeatmapCard({ visible, score, heatmapB64 }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) setTimeout(() => setShow(true), 800)
    else setShow(false)
  }, [visible])

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold flex items-center gap-2">
          🔥 Manipulation Heatmap
        </h3>
        <span className="mono text-xs text-muted">
          {heatmapB64 ? 'Grad-CAM (Real)' : 'Grad-CAM Visualization'}
        </span>
      </div>

      <div className="relative bg-bg3 rounded-xl overflow-hidden aspect-[4/3]
                      flex items-center justify-center border border-border">
        {/* Real Grad-CAM overlay from API */}
        {heatmapB64 && show ? (
          <img
            src={`data:image/png;base64,${heatmapB64}`}
            alt="Grad-CAM heatmap"
            className="w-full h-full object-cover rounded-xl transition-opacity duration-700"
            style={{ opacity: show ? 1 : 0 }}
          />
        ) : (
          /* Fallback SVG face with simulated blobs */
          <div className="relative flex items-center justify-center w-full h-full">
            <svg viewBox="0 0 260 200" className="w-full h-full">
              <ellipse cx="130" cy="95" rx="70" ry="85" fill="none" stroke="#252a50" strokeWidth="1.5" />
              {show && (
                <>
                  <ellipse cx="105" cy="70" rx="28" ry="20"
                    fill="#ff4f7b" fillOpacity="0.55" filter="url(#blur)" />
                  <ellipse cx="155" cy="70" rx="28" ry="20"
                    fill="#ff4f7b" fillOpacity="0.45" filter="url(#blur)" />
                  <ellipse cx="130" cy="130" rx="35" ry="18"
                    fill="#ffb830" fillOpacity="0.45" filter="url(#blur)" />
                  <ellipse cx="130" cy="30" rx="50" ry="22"
                    fill="#ff4f7b" fillOpacity="0.5" filter="url(#blur)" />
                  <ellipse cx="130" cy="168" rx="25" ry="14"
                    fill="#00f5c4" fillOpacity="0.25" filter="url(#blur)" />
                </>
              )}
              <defs>
                <filter id="blur"><feGaussianBlur stdDeviation="10" /></filter>
              </defs>
              <ellipse cx="105" cy="70" rx="12" ry="7" fill="none" stroke="#6b7299" strokeWidth="0.8" />
              <ellipse cx="155" cy="70" rx="12" ry="7" fill="none" stroke="#6b7299" strokeWidth="0.8" />
              <path d="M128 90 L123 115 L137 115" fill="none" stroke="#6b7299" strokeWidth="0.8" />
              <path d="M110 130 Q130 142 150 130" fill="none" stroke="#6b7299" strokeWidth="0.8" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-5 mt-3">
        {[
          { color: 'bg-accent3', label: 'High Manipulation' },
          { color: 'bg-warn',    label: 'Medium' },
          { color: 'bg-accent',  label: 'Authentic' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 mono text-xs text-muted">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
