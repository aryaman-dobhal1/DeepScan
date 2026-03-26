import { useState } from 'react'
import { useScan } from '../hooks/useScan'
import StatsBar from '../components/StatsBar'
import UploadZone from '../components/UploadZone'
import ControlsPanel from '../components/ControlsPanel'
import AnalysisLoader from '../components/AnalysisLoader'
import VerdictRing from '../components/VerdictRing'
import MetricBars from '../components/MetricBars'
import HeatmapCard from '../components/HeatmapCard'
import ForensicTable from '../components/ForensicTable'
import VideoTimeline from '../components/VideoTimeline'
import URLScanner from '../components/URLScanner'
import { AlertTriangle } from 'lucide-react'

const DEFAULT_SETTINGS = { model: 'efficientnet', sensitivity: 72 }

export default function Detect() {
  const { state, result, error, runFile, runURL, runDemo, reset } = useScan()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const handleFile = (file) => runFile(file, { model: settings.model })
  const handleURL  = (url)  => runURL(url,   { model: settings.model })
  const handleDemo = ()     => runDemo({ model: settings.model })

  const loading = state === 'loading'
  const done    = state === 'done' && result

  return (
    <div>
      <AnalysisLoader visible={loading} />

      {/* Hero */}
      <div className="text-center py-14">
        <div className="inline-flex items-center gap-2 bg-accent2/10 border border-accent2/30
                        rounded-full px-4 py-1.5 mono text-xs text-accent2 mb-5">
          ⚡ Powered by EfficientNet-B7 + XceptionNet Ensemble
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight leading-[1.08] mb-4">
          Detect{' '}
          <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
            Deepfakes
          </span>
          <br />with Forensic Precision
        </h1>
        <p className="text-muted text-lg max-w-lg mx-auto leading-relaxed">
          Multi-modal AI analysis across image, video and audio.
          Upload any media for a full forensic breakdown.
        </p>
      </div>

      <StatsBar />
      <URLScanner onScan={handleURL} />

      <div className="flex items-center gap-4 text-muted mono text-xs mb-5">
        <div className="flex-1 h-px bg-border" />
        or upload a file
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5 mb-6">
        <UploadZone onFile={handleFile} onDemo={handleDemo} />
        <ControlsPanel settings={settings} onChange={setSettings} />
      </div>

      {/* Error state */}
      {state === 'error' && (
        <div className="card p-5 mb-6 flex items-start gap-3 border-accent3/30 bg-accent3/5">
          <AlertTriangle size={18} className="text-accent3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-accent3 text-sm mb-1">Analysis failed</p>
            <p className="mono text-xs text-muted">{error}</p>
            <p className="mono text-xs text-muted mt-1">
              Make sure the backend is running at{' '}
              <span className="text-accent">{import.meta.env.VITE_API_URL || 'http://localhost:8000'}</span>
            </p>
          </div>
          <button onClick={reset} className="ml-auto btn-outline text-xs py-1.5 px-3">Retry</button>
        </div>
      )}

      {/* Results */}
      {done && (
        <>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">🎯 Detection Verdict</h3>
                <span className="mono text-xs text-muted">Confidence: {result.confidence}</span>
              </div>
              <VerdictRing score={result.fake_probability} />
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold">📊 Detection Signals</h3>
                <span className="mono text-xs text-muted">{result.model_used}</span>
              </div>
              <MetricBars animate values={result.signals} />
            </div>

            <HeatmapCard visible score={result.fake_probability} />
            <ForensicTable findings={result.metadata_findings} />
          </div>

          <div className="card p-6 mb-5 border-border2">
            <p className="mono text-xs text-muted uppercase tracking-widest mb-3">// Analysis Summary</p>
            <p className="text-sm leading-relaxed text-white/80">{result.summary}</p>
            <div className="flex gap-4 mt-4 mono text-xs text-muted">
              <span>⏱ {result.analysis_time_ms}ms</span>
              <span>📁 {result.file_type}</span>
              {result.file_size_kb && <span>💾 {(result.file_size_kb / 1024).toFixed(1)} MB</span>}
              <span>🤖 {result.model_used}</span>
            </div>
          </div>

          {result.frame_data?.length > 0 && <VideoTimeline frames={result.frame_data} />}

          <div className="flex gap-3 mt-2">
            <button className="btn-primary">📄 Download Forensic Report</button>
            <button className="btn-outline">🔗 Share Results</button>
            <button className="btn-outline" onClick={reset}>↺ New Scan</button>
          </div>
        </>
      )}
    </div>
  )
}
