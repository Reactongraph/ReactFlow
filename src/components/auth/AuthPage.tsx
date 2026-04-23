import React, { useState, useEffect } from 'react'
import {
  Workflow, Eye, EyeOff, Loader2, AlertCircle,
  Zap, GitBranch, Sparkles, Database, Mail,
  ArrowRight, CheckCircle2, Play,
} from 'lucide-react'
import { useAuthStore } from '../../store/slices/auth'

interface AuthPageProps { onSuccess: () => void }

// ── Animated workflow nodes for the left panel ─────────────────

const FLOW_NODES = [
  { id: 1, label: 'Webhook Trigger', icon: Zap,        color: 'bg-blue-500',   x: 8,  y: 12 },
  { id: 2, label: 'AI Classify',     icon: Sparkles,   color: 'bg-purple-500', x: 42, y: 8  },
  { id: 3, label: 'IF Condition',    icon: GitBranch,  color: 'bg-rose-500',   x: 42, y: 38 },
  { id: 4, label: 'PostgreSQL',      icon: Database,   color: 'bg-indigo-500', x: 72, y: 18 },
  { id: 5, label: 'Send Email',      icon: Mail,       color: 'bg-sky-500',    x: 72, y: 48 },
]

const EDGES = [
  { from: 1, to: 2 }, { from: 1, to: 3 },
  { from: 2, to: 4 }, { from: 3, to: 5 },
]

const FEATURES = [
  { icon: Zap,       text: '47 built-in node types across 10 categories' },
  { icon: Sparkles,  text: 'AI-powered workflow generation with GPT-4o' },
  { icon: GitBranch, text: 'Visual branching, loops, and retry logic' },
  { icon: Database,  text: 'Connect to PostgreSQL, MongoDB, Redis & more' },
  { icon: Play,      text: 'One-click execution with live status indicators' },
]

const TESTIMONIAL = {
  quote: "FlowBuilder cut our integration time from weeks to hours. The visual editor is incredibly intuitive and the AI builder is a game-changer.",
  author: "Sarah Chen",
  role: "Head of Engineering, Acme Corp",
  initials: "SC",
}

// ── Animated edge SVG line ─────────────────────────────────────

const AnimatedEdge: React.FC<{
  x1: number; y1: number; x2: number; y2: number; delay: number
}> = ({ x1, y1, x2, y2, delay }) => {
  const mx = (x1 + x2) / 2
  const d  = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
  return (
    <path
      d={d}
      fill="none"
      stroke="url(#edgeGrad)"
      strokeWidth="1.5"
      strokeDasharray="6 4"
      opacity="0.5"
      style={{ animation: `dashMove 2s linear ${delay}s infinite` }}
    />
  )
}

// ── Flow node card ─────────────────────────────────────────────

const FlowNodeCard: React.FC<{
  label: string; Icon: React.FC<any>; color: string
  x: number; y: number; delay: number
}> = ({ label, Icon, color, x, y, delay }) => (
  <div
    className="absolute flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm shadow-lg"
    style={{
      left: `${x}%`, top: `${y}%`,
      animation: `floatNode 4s ease-in-out ${delay}s infinite`,
    }}
  >
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${color}`}>
      <Icon size={12} className="text-white" />
    </span>
    <span className="text-xs font-semibold text-white whitespace-nowrap">{label}</span>
  </div>
)

// ── Left marketing panel ───────────────────────────────────────

const LeftPanel: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(i => (i + 1) % FEATURES.length), 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-10 select-none">

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/40">
          <Workflow size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">FlowBuilder</span>
      </div>

      {/* Headline */}
      <div className="relative z-10 mt-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-indigo-300">Workflow Automation Platform</span>
        </div>
        <h2 className="text-3xl font-bold leading-tight text-white">
          Build powerful<br />
          <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
            automations visually
          </span>
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Connect APIs, databases, AI models, and communication tools — no code required. Design, test, and deploy in minutes.
        </p>
      </div>

      {/* Animated workflow canvas */}
      <div className="relative z-10 mt-8 h-44 w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {/* SVG edges */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {EDGES.map((edge, i) => {
            const from = FLOW_NODES.find(n => n.id === edge.from)!
            const to   = FLOW_NODES.find(n => n.id === edge.to)!
            return (
              <AnimatedEdge
                key={i}
                x1={from.x + 12} y1={from.y + 4}
                x2={to.x}        y2={to.y + 4}
                delay={i * 0.5}
              />
            )
          })}
        </svg>

        {/* Node cards */}
        {FLOW_NODES.map((node, i) => (
          <FlowNodeCard
            key={node.id}
            label={node.label}
            Icon={node.icon}
            color={node.color}
            x={node.x} y={node.y}
            delay={i * 0.4}
          />
        ))}

        {/* Execution pulse */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400">Running</span>
        </div>
      </div>

      {/* Feature list */}
      <div className="relative z-10 mt-8 space-y-2.5">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500 ${
              activeFeature === i
                ? 'bg-white/10 border border-white/15'
                : 'border border-transparent'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-500 ${
              activeFeature === i ? 'bg-indigo-500 shadow-lg shadow-indigo-500/40' : 'bg-white/5'
            }`}>
              <f.icon size={13} className={activeFeature === i ? 'text-white' : 'text-slate-500'} />
            </span>
            <span className={`text-xs leading-snug transition-colors duration-500 ${
              activeFeature === i ? 'text-white font-medium' : 'text-slate-500'
            }`}>
              {f.text}
            </span>
            {activeFeature === i && (
              <CheckCircle2 size={13} className="ml-auto shrink-0 text-emerald-400" />
            )}
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div className="relative z-10 mt-auto pt-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs leading-relaxed text-slate-300 italic">
            "{TESTIMONIAL.quote}"
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              {TESTIMONIAL.initials}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{TESTIMONIAL.author}</p>
              <p className="text-[10px] text-slate-500">{TESTIMONIAL.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Input field ────────────────────────────────────────────────

const InputField: React.FC<{
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  required?: boolean
  minLength?: number
  suffix?: React.ReactNode
}> = ({ label, type, value, onChange, placeholder, required, minLength, suffix }) => (
  <div>
    <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
    <div className="relative">
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  </div>
)

// ── Right auth panel ───────────────────────────────────────────

const RightPanel: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [mode,     setMode]     = useState<'login' | 'register'>('login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const { login, register, loading, error, clearError } = useAuthStore()

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); clearError()
    setName(''); setEmail(''); setPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearError()
    try {
      if (mode === 'login') await login(email, password)
      else await register(name, email, password)
      onSuccess()
    } catch { /* error shown from store */ }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-white px-8 py-12 lg:px-12">
      <div className="w-full max-w-sm">

        {/* Mobile logo (hidden on lg) */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Workflow size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-800">FlowBuilder</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === 'login'
              ? 'Sign in to access your workflows and automations'
              : 'Start building powerful automations in minutes'}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={[
                'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                mode === m
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <InputField
              label="Full name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Jane Doe"
              required
            />
          )}

          <InputField
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            required
          />

          <InputField
            label="Password"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter your password'}
            required
            minLength={mode === 'register' ? 8 : undefined}
            suffix={
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          {mode === 'login' && (
            <div className="flex justify-end">
              <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors">
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200 disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading
              ? <Loader2 size={15} className="animate-spin" />
              : <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            }
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Switch mode link */}
        <p className="text-center text-sm text-slate-500">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>

        {/* Stats row */}
        <div className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          {[
            { value: '47+', label: 'Node types' },
            { value: '5',   label: 'Templates'  },
            { value: '∞',   label: 'Workflows'  },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-[10px] text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          By continuing, you agree to our{' '}
          <span className="text-slate-500 underline underline-offset-2 cursor-pointer">Terms</span>
          {' '}and{' '}
          <span className="text-slate-500 underline underline-offset-2 cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => (
  <>
    {/* Keyframe animations injected once */}
    <style>{`
      @keyframes floatNode {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-6px); }
      }
      @keyframes dashMove {
        to { stroke-dashoffset: -20; }
      }
    `}</style>

    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left panel — hidden on small screens */}
      <div className="hidden w-[52%] shrink-0 lg:block">
        <LeftPanel />
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        <RightPanel onSuccess={onSuccess} />
      </div>
    </div>
  </>
)

export default AuthPage
