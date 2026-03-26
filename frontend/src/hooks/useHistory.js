import { useState, useEffect, useCallback } from 'react'
import { getHistory, getStats, deleteScan, downloadCSV, downloadPDF } from '../utils/api'

export function useHistory(params = {}) {
  const [items,   setItems]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const load = useCallback(async (overrides = {}) => {
    setLoading(true)
    setError(null)
    try {
      const [histData, statsData] = await Promise.all([
        getHistory({ ...params, ...overrides }),
        getStats(),
      ])
      setItems(histData)
      setStats(statsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])  // eslint-disable-line

  useEffect(() => { load() }, [load])

  const remove = useCallback(async (id) => {
    await deleteScan(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  return { items, stats, loading, error, reload: load, remove }
}
