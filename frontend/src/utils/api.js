/**
 * DeepScan API client
 * All calls go through this module so the base URL is configured in one place.
 * Set VITE_API_URL in your .env file (defaults to localhost:8000 for dev).
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function handleResponse(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { msg = (await res.json()).detail || msg } catch (_) {}
    throw new Error(msg)
  }
  return res.json()
}

// ── Scan ────────────────────────────────────────────────────────────────────

/**
 * Upload a File object and scan it.
 * @param {File} file
 * @param {object} opts  { model, sensitivity }
 * @returns {Promise<ScanResponse>}
 */
export async function scanFile(file, opts = {}) {
  const form = new FormData()
  form.append('file', file)

  const model = opts.model || 'efficientnet'
  const url = `${BASE}/api/scan/upload?model=${encodeURIComponent(model)}`

  const res = await fetch(url, { method: 'POST', body: form })
  return handleResponse(res)
}

/**
 * Scan a remote URL.
 * @param {string} url      Media URL to fetch and analyse
 * @param {object} opts     { model }
 */
export async function scanURL(mediaUrl, opts = {}) {
  const res = await fetch(`${BASE}/api/scan/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: mediaUrl, model: opts.model || 'efficientnet' }),
  })
  return handleResponse(res)
}

/**
 * Fetch a single scan result by ID.
 * @param {string} id
 */
export async function getScan(id) {
  const res = await fetch(`${BASE}/api/scan/${id}`)
  return handleResponse(res)
}

/**
 * Delete a scan record.
 * @param {string} id
 */
export async function deleteScan(id) {
  const res = await fetch(`${BASE}/api/scan/${id}`, { method: 'DELETE' })
  return handleResponse(res)
}

// ── History ─────────────────────────────────────────────────────────────────

/**
 * Fetch paginated scan history.
 * @param {object} params  { page, limit, verdict, ftype }
 */
export async function getHistory(params = {}) {
  const q = new URLSearchParams()
  if (params.page)    q.set('page',    params.page)
  if (params.limit)   q.set('limit',   params.limit)
  if (params.verdict) q.set('verdict', params.verdict)
  if (params.ftype)   q.set('ftype',   params.ftype)

  const res = await fetch(`${BASE}/api/history?${q}`)
  return handleResponse(res)
}

/**
 * Fetch aggregate statistics.
 */
export async function getStats() {
  const res = await fetch(`${BASE}/api/history/stats`)
  return handleResponse(res)
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function getHealth() {
  const res = await fetch(`${BASE}/health`)
  return handleResponse(res)
}

// ── Export ───────────────────────────────────────────────────────────────────

/**
 * Trigger CSV download of full history.
 */
export function downloadCSV() {
  window.open(`${BASE}/api/export/csv`, '_blank')
}

/**
 * Trigger PDF download for a single scan.
 * @param {string} id
 */
export function downloadPDF(id) {
  window.open(`${BASE}/api/export/pdf/${id}`, '_blank')
}
