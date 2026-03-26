import { useState, useCallback } from 'react'
import { scanFile, scanURL } from '../utils/api'

/**
 * useScan — manages the full scan lifecycle:
 *   idle → loading → results | error
 *
 * Usage:
 *   const { state, result, error, runFile, runURL, reset } = useScan()
 */
export function useScan() {
  const [state,  setState]  = useState('idle')   // 'idle' | 'loading' | 'done' | 'error'
  const [result, setResult] = useState(null)
  const [error,  setError]  = useState(null)

  const runFile = useCallback(async (file, opts = {}) => {
    setState('loading')
    setResult(null)
    setError(null)
    try {
      const data = await scanFile(file, opts)
      setResult(data)
      setState('done')
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }, [])

  const runURL = useCallback(async (url, opts = {}) => {
    setState('loading')
    setResult(null)
    setError(null)
    try {
      const data = await scanURL(url, opts)
      setResult(data)
      setState('done')
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }, [])

  const runDemo = useCallback(async (opts = {}) => {
    // Demo: upload a synthetic 1x1 white pixel JPEG
    setState('loading')
    setResult(null)
    setError(null)
    try {
      // Create a tiny canvas-based image blob for the demo
      const blob = await makeDemoBlob()
      const file = new File([blob], 'demo_scan.jpg', { type: 'image/jpeg' })
      const data = await scanFile(file, opts)
      setResult(data)
      setState('done')
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setError(null)
  }, [])

  return { state, result, error, runFile, runURL, runDemo, reset }
}

// ── helpers ─────────────────────────────────────────────────────────────────

async function makeDemoBlob() {
  // Build a tiny canvas and export as JPEG blob
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    // Draw a gradient so it looks like a face-ish blob
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 32)
    grad.addColorStop(0, '#f5c5a3')
    grad.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)
    canvas.toBlob(resolve, 'image/jpeg', 0.9)
  })
}
