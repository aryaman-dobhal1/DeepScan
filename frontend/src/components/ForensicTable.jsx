const typeClass = {
  OK:     'text-accent',
  WARN:   'text-warn',
  DANGER: 'text-accent3',
}

// Fallback demo rows used when no findings prop supplied
const DEMO_ROWS = [
  { field: 'File Format',       value: 'JPEG / DCT',           status: 'VALID',      severity: 'OK' },
  { field: 'EXIF GPS Data',     value: 'Stripped',             status: 'SUSPICIOUS', severity: 'WARN' },
  { field: 'Creation Software', value: 'Stable Diffusion',     status: 'FLAGGED',    severity: 'DANGER' },
  { field: 'Compression Level', value: 'Q=94 (Unusual)',       status: 'ANOMALY',    severity: 'WARN' },
  { field: 'Color Profile',     value: 'sRGB IEC61966',        status: 'VALID',      severity: 'OK' },
  { field: 'Double JPEG',       value: 'Detected (2x)',        status: 'FLAGGED',    severity: 'DANGER' },
  { field: 'Noise Fingerprint', value: 'Inconsistent',         status: 'FLAGGED',    severity: 'DANGER' },
]

export default function ForensicTable({ findings }) {
  const rows = findings?.length ? findings : DEMO_ROWS

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold">🔬 Metadata Forensics</h3>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {['Field', 'Value', 'Status'].map(h => (
              <th key={h} className="mono text-xs text-muted uppercase tracking-widest pb-2.5 text-left font-normal pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors last:border-0">
              <td className="py-2.5 pr-4 mono text-xs text-muted">{r.field}</td>
              <td className="py-2.5 pr-4 mono text-xs text-white/80">{r.value}</td>
              <td className={`py-2.5 mono text-xs font-bold ${typeClass[r.severity] || 'text-muted'}`}>
                {r.severity === 'DANGER' ? '⚠ ' : ''}{r.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
