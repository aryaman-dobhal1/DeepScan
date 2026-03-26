const stats = [
  { label: 'Detection Accuracy', value: '98.7%', sub: 'FaceForensics++ benchmark', color: 'text-accent',  bar: 'bg-accent' },
  { label: 'Scans Today',        value: '1,247',  sub: 'All media types',          color: 'text-accent2', bar: 'bg-accent2' },
  { label: 'Deepfakes Found',    value: '412',    sub: '33% detection rate',       color: 'text-accent3', bar: 'bg-accent3' },
  { label: 'Avg. Analysis Time', value: '2.3s',   sub: 'Images under 10 MB',       color: 'text-warn',    bar: 'bg-warn' },
]

export default function StatsBar() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <div key={i} className="card p-5 relative overflow-hidden group hover:border-border2 transition-colors">
          {/* Top accent line */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.bar}`} />
          <p className="mono text-xs text-muted uppercase tracking-widest mb-2">{s.label}</p>
          <p className={`text-3xl font-extrabold tracking-tighter ${s.color}`}>{s.value}</p>
          <p className="mono text-xs text-muted mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}
