import { useState } from 'react'
import { Link, Zap } from 'lucide-react'

export default function URLScanner({ onScan }) {
  const [url, setUrl] = useState('')

  return (
    <div className="flex gap-3 mb-5">
      <div className="relative flex-1">
        <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && url.trim() && onScan(url)}
          placeholder="Paste image or video URL to scan (e.g. https://example.com/photo.jpg)"
          className="w-full bg-card border border-border2 rounded-xl text-white pl-9 pr-4 py-3
                     mono text-sm outline-none focus:border-accent transition-colors
                     placeholder:text-muted"
        />
      </div>
      <button
        onClick={() => url.trim() && onScan(url)}
        className="btn-outline whitespace-nowrap"
      >
        <Zap size={14} />
        Scan URL
      </button>
    </div>
  )
}
