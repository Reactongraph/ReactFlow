import React, { useEffect, useRef } from 'react'
import {
  ArrowDownToLine, Globe, Shuffle, GitFork, Sparkles,
  ArrowUpFromLine, Cpu, LayoutGrid, Maximize2, Clipboard,
} from 'lucide-react'
import { NodeType } from '../types'

interface ContextMenuProps {
  x: number
  y: number
  onAddNode: (type: NodeType) => void
  onPaste: () => void
  onAutoLayout: () => void
  onFitView: () => void
  onClose: () => void
}

const NODE_ITEMS: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'input',      label: 'Input',      icon: <ArrowDownToLine size={13} />,  color: 'text-blue-500' },
  { type: 'api',        label: 'API Call',   icon: <Globe size={13} />,            color: 'text-amber-500' },
  { type: 'transform',  label: 'Transform',  icon: <Shuffle size={13} />,          color: 'text-cyan-500' },
  { type: 'processing', label: 'Processing', icon: <Cpu size={13} />,              color: 'text-violet-500' },
  { type: 'decision',   label: 'Decision',   icon: <GitFork size={13} />,          color: 'text-pink-500' },
  { type: 'ai',         label: 'AI Node',    icon: <Sparkles size={13} />,         color: 'text-purple-600' },
  { type: 'output',     label: 'Output',     icon: <ArrowUpFromLine size={13} />,  color: 'text-emerald-500' },
]

const ContextMenu: React.FC<ContextMenuProps> = ({
  x, y, onAddNode, onPaste, onAutoLayout, onFitView, onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Keep menu inside viewport
  const left = Math.min(x, window.innerWidth  - 200)
  const top  = Math.min(y, window.innerHeight - 360)

  return (
    <div
      ref={ref}
      className="context-menu fixed z-50 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
      style={{ left, top }}
    >
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Add Node
      </p>

      {NODE_ITEMS.map(({ type, label, icon, color }) => (
        <button
          key={type}
          onClick={() => { onAddNode(type); onClose() }}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span className={color}>{icon}</span>
          {label}
        </button>
      ))}

      <div className="my-1 border-t border-slate-100" />

      <button
        onClick={() => { onPaste(); onClose() }}
        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Clipboard size={13} className="text-slate-400" /> Paste
      </button>
      <button
        onClick={() => { onAutoLayout(); onClose() }}
        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <LayoutGrid size={13} className="text-slate-400" /> Auto Layout
      </button>
      <button
        onClick={() => { onFitView(); onClose() }}
        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Maximize2 size={13} className="text-slate-400" /> Fit View
      </button>
    </div>
  )
}

export default ContextMenu
