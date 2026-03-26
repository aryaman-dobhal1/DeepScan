import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Zap } from 'lucide-react'

export default function UploadZone({ onFile, onDemo }) {
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) onFile(accepted[0])
  }, [onFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [], 'audio/*': [] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`relative flex flex-col items-center justify-center text-center
                  rounded-2xl border-2 border-dashed p-16 cursor-pointer
                  transition-all duration-300
                  ${isDragActive
                    ? 'border-accent bg-accent/5 scale-[1.01]'
                    : 'border-border2 bg-card hover:border-accent hover:bg-accent/[0.02]'}`}
    >
      <input {...getInputProps()} />

      <div className="text-5xl mb-4 opacity-70">
        <Upload size={52} className="text-muted" />
      </div>

      <h3 className="text-xl font-bold mb-2">
        {isDragActive ? 'Drop to scan' : 'Drop your file here'}
      </h3>
      <p className="mono text-sm text-muted mb-6">
        or click to browse from your device
      </p>

      {/* Type chips */}
      <div className="flex justify-center gap-2 mb-8">
        <span className="tag-img">JPG · PNG · WEBP</span>
        <span className="tag-vid">MP4 · MOV · AVI</span>
        <span className="tag-aud">MP3 · WAV · AAC</span>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDemo() }}
        className="btn-primary"
      >
        <Zap size={15} />
        Run Demo Scan
      </button>

      {/* Background watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <span className="text-[140px] font-extrabold tracking-tighter">AI</span>
      </div>
    </div>
  )
}
