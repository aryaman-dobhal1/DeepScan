import { useState, useEffect } from 'react'
import { Download, Share2, RefreshCw, FileText } from 'lucide-react'
import { getHistory } from '../utils/api'
import { downloadPDF } from '../utils/api'

const verdictClass = {
  DEEPFAKE:  'bg-accent3/10 text-accent3 border-accent3/30',
  SUSPECT:   'bg-warn/10 text-warn border-warn/30',
  AUTHENTIC: 'bg-accent/10 text-accent border-accent/25',
}

const fileIcon = { image: '🖼️', video: '🎬', audio: '🎵' }

export default function Reports() {
  const [scans,   setScans]   = useState([])
  const [active,  setActive]  = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getHistory({ limit: 50 })
      setScans(data)
      if (data.length > 0 && !active) setActive(data[0])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const selected = active || scans[0]

  return (
    <div>
      <div className="pt-10 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">Forensic Reports</h1>
          <p className="mono text-sm text-muted">// Select a scan to view its full report</p>
        </div>
        <button className="btn-outline gap-2" onClick={load}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        {/* Scan list sidebar */}
        <div className="flex flex-col gap-2 max-h-[700px] overflow-y-auto pr-1">
          {loading && [...Array(4)].map((_, i) => (
            <div key={i} className="card h-16 shimmer rounded-xl" />
          ))}
          {!loading && scans.length === 0 && (
            <div className="card p-6 text-center text-muted mono text-xs">
              No scans yet — run a scan first
            </div>
          )}
          {scans.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className={`card px-4 py-3 text-left transition-all duration-200 hover:translate-x-1
                          ${selected?.id === s.id ? 'border-accent2 bg-accent2/5' : 'hover:border-border2'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{fileIcon[s.file_type] || '📄'}</span>
                <span className="text-xs font-bold truncate flex-1">{s.filename}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="mono text-xs text-muted">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
                <span className={`mono text-xs font-bold px-2 py-0.5 rounded border
                                  ${verdictClass[s.verdict]}`}>
                  {s.verdict}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Report detail panel */}
        {selected ? (
          <div className="card p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-5 border-b border-border">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight mb-1">
                  {selected.filename}
                </h2>
                <p className="mono text-xs text-muted">
                  ID: {selected.id?.slice(0,16).toUpperCase()} ·{' '}
                  {selected.model_used} ·{' '}
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadPDF(selected.id)}
                  className="btn-primary text-sm"
                >
                  <Download size={14} /> PDF Report
                </button>
                <div className={`px-4 py-2 rounded-lg font-extrabold text-sm tracking-widest border
                                  ${verdictClass[selected.verdict]}`}>
                  {selected.verdict === 'DEEPFAKE' ? '⚠ ' : ''}
                  {selected.verdict}
                </div>
              </div>
            </div>

            {/* Fake probability */}
            <div className="flex items-center gap-8 mb-6">
              <div>
                <p className="mono text-xs text-muted uppercase tracking-widest mb-1">
                  Fake Probability
                </p>
                <p className={`text-5xl font-extrabold tracking-tighter
                    ${selected.verdict === 'DEEPFAKE' ? 'text-accent3'
                    : selected.verdict === 'SUSPECT'   ? 'text-warn'
                    : 'text-accent'}`}>
                  {selected.fake_probability?.toFixed(1)}%
                </p>
              </div>
              <div className="flex-1 h-3 bg-border2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700
                    ${selected.verdict === 'DEEPFAKE' ? 'bg-accent3'
                    : selected.verdict === 'SUSPECT'   ? 'bg-warn'
                    : 'bg-accent'}`}
                  style={{ width: `${selected.fake_probability}%` }}
                />
              </div>
              <div className="text-right">
                <p className="mono text-xs text-muted">File type</p>
                <p className="font-bold text-sm uppercase">{selected.file_type}</p>
              </div>
              <div className="text-right">
                <p className="mono text-xs text-muted">Analysis time</p>
                <p className="font-bold text-sm">{selected.analysis_time_ms}ms</p>
              </div>
            </div>

            {/* Divider */}
            <p className="mono text-xs text-muted uppercase tracking-widest mb-4">
              // Actions
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => downloadPDF(selected.id)}
                className="btn-primary"
              >
                <Download size={14} />
                Download Full PDF
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/reports?id=${selected.id}`
                  )
                }}
                className="btn-outline"
              >
                <Share2 size={14} />
                Copy Link
              </button>
            </div>

            <p className="mono text-xs text-muted mt-4">
              The PDF report includes signal scores, metadata forensics, Grad-CAM
              heatmap, and executive summary.
            </p>
          </div>
        ) : (
          <div className="card p-16 flex flex-col items-center justify-center text-muted gap-3">
            <FileText size={40} className="opacity-20" />
            <p className="mono text-sm">Select a scan from the list to view its report</p>
          </div>
        )}
      </div>
    </div>
  )
}
