import { useState } from 'react'
import { useHistory } from '../hooks/useHistory'
import { downloadCSV, downloadPDF } from '../utils/api'
import { Search, Download, Trash2, RefreshCw, FileText } from 'lucide-react'

const verdictClass = {
  DEEPFAKE:  'bg-accent3/10 text-accent3',
  SUSPECT:   'bg-warn/10 text-warn',
  AUTHENTIC: 'bg-accent/10 text-accent',
}

const fileIcon = { image: '🖼️', video: '🎬', audio: '🎵' }

export default function History() {
  const [query,  setQuery]  = useState('')
  const [filter, setFilter] = useState('all')
  const { items, stats, loading, error, reload, remove } = useHistory()

  const filtered = items.filter(h => {
    const matchQ = h.filename.toLowerCase().includes(query.toLowerCase())
    const matchF = filter === 'all' || h.verdict === filter.toUpperCase()
    return matchQ && matchF
  })

  return (
    <div>
      <div className="pt-10 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Scan History</h1>
        <p className="mono text-sm text-muted">// All previous analyses — click any row to view full report</p>
      </div>

      {/* Live stats from API */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Scans',    val: stats.total_scans,       color: 'text-accent2' },
            { label: 'Deepfakes',      val: stats.deepfakes_found,    color: 'text-accent3' },
            { label: 'Suspects',       val: stats.suspects_found,     color: 'text-warn' },
            { label: 'Detection Rate', val: `${stats.detection_rate_pct}%`, color: 'text-accent' },
          ].map(({ label, val, color }) => (
            <div key={label} className="card p-4">
              <p className="mono text-xs text-muted mb-1">{label}</p>
              <p className={`text-2xl font-extrabold tracking-tight ${color}`}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-card border border-border2 rounded-xl text-white pl-9 pr-4 py-2.5
                       mono text-sm outline-none focus:border-accent transition-colors placeholder:text-muted"
          />
        </div>
        {['all', 'deepfake', 'suspect', 'authentic'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-xl mono text-xs font-bold uppercase tracking-wide transition-all
                        ${filter === f
                          ? 'bg-accent text-black'
                          : 'bg-card border border-border2 text-muted hover:border-accent hover:text-white'}`}
          >
            {f}
          </button>
        ))}
        <button className="btn-outline gap-2" onClick={() => reload()}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
        <button className="btn-outline gap-2" onClick={downloadCSV}>
          <Download size={14} />
          CSV
        </button>
      </div>

      {error && (
        <div className="card p-4 mb-4 border-accent3/30 bg-accent3/5 mono text-xs text-accent3">
          ⚠ Could not load history: {error} — is the backend running?
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 h-16 shimmer rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card px-5 py-4 flex items-center gap-4 cursor-pointer
                         hover:border-border2 hover:translate-x-1 transition-all duration-200"
            >
              <div className="w-12 h-12 bg-bg3 border border-border rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {fileIcon[item.file_type] || '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{item.filename}</p>
                <p className="mono text-xs text-muted mt-0.5">
                  {item.file_type.toUpperCase()} ·{' '}
                  {item.file_size_kb ? `${(item.file_size_kb / 1024).toFixed(1)} MB · ` : ''}
                  {new Date(item.created_at).toLocaleString()} · {item.model_used}
                </p>
              </div>
              <div className="mono text-sm text-muted text-right flex-shrink-0">
                {item.fake_probability.toFixed(1)}% fake
              </div>
              <div className={`px-3 py-1 rounded-lg mono text-xs font-bold tracking-wide flex-shrink-0
                              ${verdictClass[item.verdict]}`}>
                {item.verdict}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); remove(item.id) }}
                className="text-muted hover:text-accent3 transition-colors flex-shrink-0"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="card p-16 text-center text-muted mono text-sm">
              {items.length === 0
                ? 'No scans yet — run your first scan on the Detect page'
                : `No results matching "${query}"`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
