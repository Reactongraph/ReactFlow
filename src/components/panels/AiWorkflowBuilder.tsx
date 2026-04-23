import React, { useState } from 'react'
import { Sparkles, Send, X, Loader2, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { aiBuilderService, GeneratedWorkflow } from '../../services/ai-builder.service'
import { getNode } from '../../nodes'

const EXAMPLE_PROMPTS = [
  'Fetch weather data from an API and send an email summary',
  'When a webhook fires, use AI to summarize the payload, then post to Slack',
  'Check if user score is above 80, then send a congratulations email, otherwise send a follow-up',
  'Every hour, pull data from an API, transform it, and store results',
]

interface Props {
  onClose:   () => void
  onApply:   (workflow: GeneratedWorkflow) => void
}

export const AiWorkflowBuilder: React.FC<Props> = ({ onClose, onApply }) => {
  const [prompt,    setPrompt]    = useState('')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<GeneratedWorkflow | null>(null)
  const [error,     setError]     = useState<string | null>(null)

  const generate = async () => {
    if (prompt.trim().length < 10) {
      setError('Please describe your workflow in at least 10 characters')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const wf = await aiBuilderService.generate(prompt.trim())
      setResult(wf)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">AI Workflow Builder</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/70">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Prompt input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Describe the automation you want to build
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Fetch data from my API every hour, check if any values exceed a threshold, and send an email alert…"
                rows={4}
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                disabled={loading}
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-slate-300">
                ⌘↵ to generate
              </div>
            </div>
          </div>

          {/* Example prompts */}
          {!result && !loading && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-full text-slate-600 transition-colors"
                  >
                    {p.slice(0, 40)}…
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Result preview */}
          {result && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-sm font-semibold text-slate-800">{result.name}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {result.nodes.length} nodes · {result.edges.length} edges
                </span>
              </div>
              {/* Node flow preview with registry colors */}
              <div className="flex items-center gap-1 flex-wrap">
                {result.nodes.map((n, i) => {
                  // Resolve type the same way TopBar does
                  const key = n.type.toLowerCase().replace(/[_\s]+/g, '-')
                  const def = getNode(key) ?? getNode(key.replace(/-/g, ''))
                  return (
                    <React.Fragment key={n.id}>
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
                        {def ? (
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white bg-gradient-to-br ${def.color}`}>
                            {def.icon}
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-200" />
                        )}
                        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{n.label}</span>
                      </div>
                      {i < result.nodes.length - 1 && (
                        <ArrowRight size={12} className="text-slate-300 shrink-0" />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {result ? (
              <>
                <Button variant="primary" size="sm" onClick={() => onApply(result)} className="flex-1">
                  <CheckCircle2 size={13} /> Apply to Canvas
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setResult(null); setPrompt('') }}>
                  Regenerate
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={generate}
                disabled={loading || prompt.trim().length < 10}
                className="flex-1"
              >
                {loading ? (
                  <><Loader2 size={13} className="animate-spin" /> Generating…</>
                ) : (
                  <><Send size={13} /> Generate Workflow</>
                )}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
