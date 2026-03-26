import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Square, Camera, AlertTriangle } from 'lucide-react'
import { scanFile } from '../utils/api'

const METRICS = [
  { id: 'prob',    label: 'Fake Probability' },
  { id: 'fps',     label: 'FPS' },
  { id: 'faces',   label: 'Faces Detected' },
  { id: 'latency', label: 'Model Latency' },
  { id: 'verdict', label: 'Verdict' },
  { id: 'scans',   label: 'Frames Scanned' },
]

export default function LiveCam() {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const intervalRef = useRef(null)
  const scanCount   = useRef(0)

  const [state,   setState]   = useState('idle')   // idle | running | error
  const [metrics, setMetrics] = useState({})
  const [camErr,  setCamErr]  = useState(null)
  const [history, setHistory] = useState([])        // last 10 frame scores

  // ── Start webcam ──────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setCamErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
      streamRef.current      = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setState('running')
      startScanning()
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied — please allow camera access in your browser.'
        : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : `Camera error: ${err.message}`
      setCamErr(msg)
      setState('error')
    }
  }, [])

  // ── Stop webcam ───────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setState('idle')
    setMetrics({})
    scanCount.current = 0
  }, [])

  useEffect(() => () => stop(), [stop])

  // ── Capture frame → send to API ──────────────────────────────────────────
  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)

    const t0 = Date.now()
    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        const file   = new File([blob], 'webcam_frame.jpg', { type: 'image/jpeg' })
        const result = await scanFile(file, { model: 'efficientnet' })
        const ms     = Date.now() - t0
        scanCount.current++

        const prob    = result.fake_probability
        const verdict = prob >= 70 ? 'DEEPFAKE' : prob >= 40 ? 'SUSPECT' : 'AUTHENTIC'
        const color   = prob >= 70 ? 'text-accent3' : prob >= 40 ? 'text-warn' : 'text-accent'

        setMetrics({
          prob:    { val: `${prob}%`,           color },
          fps:     { val: `~${Math.round(1000 / ms)} fps`, color: 'text-accent' },
          faces:   { val: result.faces_detected ?? '1',    color: 'text-white' },
          latency: { val: `${ms}ms`,             color: 'text-accent2' },
          verdict: { val: verdict,               color },
          scans:   { val: scanCount.current,     color: 'text-white' },
        })

        setHistory(h => [...h.slice(-29), prob])
      } catch (e) {
        // silently skip failed frames
      }
    }, 'image/jpeg', 0.85)
  }, [])

  const startScanning = useCallback(() => {
    // Scan one frame every 3 seconds (CPU inference ~2-4s each)
    intervalRef.current = setInterval(captureAndScan, 3000)
  }, [captureAndScan])

  // ── Capture single still ─────────────────────────────────────────────────
  const captureStill = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width  = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = 'deepscan_capture.jpg'; a.click()
    }, 'image/jpeg', 0.95)
  }, [])

  const running = state === 'running'
  const prob    = parseFloat(metrics.prob?.val) || 0
  const barColor = prob >= 70 ? '#ff4f7b' : prob >= 40 ? '#ffb830' : '#00f5c4'

  return (
    <div>
      <div className="pt-10 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">Live Webcam Analysis</h1>
        <p className="mono text-sm text-muted">// Real-time deepfake detection · 1 frame per 3 seconds</p>
      </div>

      <div className="card p-8">
        {/* Camera error */}
        {camErr && (
          <div className="flex items-start gap-3 p-4 mb-6 rounded-xl bg-accent3/5 border border-accent3/30">
            <AlertTriangle size={18} className="text-accent3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-accent3 text-sm mb-1">Camera Error</p>
              <p className="mono text-xs text-muted">{camErr}</p>
            </div>
          </div>
        )}

        {/* Video feed */}
        <div className="relative w-full max-w-lg mx-auto aspect-[4/3] bg-bg3 rounded-2xl
                        border border-border overflow-hidden mb-6">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline muted
            style={{ display: running ? 'block' : 'none' }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Idle placeholder */}
          {!running && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
              <Camera size={40} className="opacity-30" />
              <p className="mono text-sm">Click Start to enable camera</p>
            </div>
          )}

          {/* Scan overlay when running */}
          {running && (
            <>
              {/* Corner brackets */}
              {[
                'top-3 left-3 border-t-2 border-l-2',
                'top-3 right-3 border-t-2 border-r-2',
                'bottom-3 left-3 border-b-2 border-l-2',
                'bottom-3 right-3 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 border-accent rounded-sm ${cls}`} />
              ))}

              {/* Live badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2
                              flex items-center gap-2 bg-black/60 backdrop-blur-sm
                              border border-accent3/40 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent3 animate-pulse" />
                <span className="mono text-xs text-accent3 font-bold">LIVE</span>
              </div>

              {/* Probability bar at bottom */}
              {metrics.prob && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${prob}%`, background: barColor }}
                  />
                </div>
              )}

              {/* Verdict overlay */}
              {metrics.verdict && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2
                                bg-black/70 backdrop-blur-sm rounded-lg px-4 py-1.5">
                  <span className={`mono text-xs font-bold ${metrics.verdict.color}`}>
                    {metrics.prob?.val} — {metrics.verdict.val}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Live sparkline */}
        {history.length > 1 && (
          <div className="max-w-lg mx-auto mb-5">
            <div className="flex items-end gap-0.5 h-10 bg-bg3 rounded-lg px-2 py-1.5">
              {history.map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm min-w-[3px] transition-all duration-300"
                  style={{
                    height: `${Math.max(8, v)}%`,
                    background: v >= 70 ? '#ff4f7b' : v >= 40 ? '#ffb830' : '#00f5c4',
                    opacity: 0.4 + (i / history.length) * 0.6,
                  }}
                />
              ))}
            </div>
            <p className="mono text-xs text-muted text-center mt-1">fake probability over last {history.length} frames</p>
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
          {METRICS.map(({ id, label }) => (
            <div key={id} className="bg-bg3 border border-border rounded-xl p-3 text-left">
              <p className="mono text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-lg font-extrabold tracking-tight ${metrics[id]?.color ?? 'text-muted'}`}>
                {metrics[id]?.val ?? '—'}
              </p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!running ? (
            <button className="btn-primary" onClick={start}>
              <Play size={14} /> Start Live Scan
            </button>
          ) : (
            <button className="btn-danger" onClick={stop}>
              <Square size={14} /> Stop
            </button>
          )}
          <button
            className="btn-outline"
            onClick={captureStill}
            disabled={!running}
          >
            <Camera size={14} /> Capture Frame
          </button>
        </div>

        {/* Note */}
        <p className="mono text-xs text-muted text-center mt-4">
          One frame scanned every 3 seconds · inference runs on your backend · requires camera permission
        </p>
      </div>
    </div>
  )
}
