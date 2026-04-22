import React, { useEffect, useState } from 'react'
import { Key, Plus, Trash2, X, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  credentialsService,
  Credential,
  CreateCredentialPayload,
} from '../../services/credentials.service'

const CREDENTIAL_TYPES = [
  { value: 'openai',  label: 'OpenAI',       fields: ['apiKey'] },
  { value: 'slack',   label: 'Slack',         fields: ['token', 'signingSecret'] },
  { value: 'google',  label: 'Google',        fields: ['clientId', 'clientSecret', 'refreshToken'] },
  { value: 'stripe',  label: 'Stripe',        fields: ['secretKey'] },
  { value: 'smtp',    label: 'SMTP',          fields: ['host', 'port', 'user', 'pass'] },
  { value: 'http',    label: 'HTTP Bearer',   fields: ['token'] },
  { value: 'custom',  label: 'Custom (JSON)', fields: [] },
] as const

type CredTypeValue = typeof CREDENTIAL_TYPES[number]['value']

const ICON_COLORS: Record<CredTypeValue, string> = {
  openai:  'text-emerald-600 bg-emerald-50',
  slack:   'text-purple-600 bg-purple-50',
  google:  'text-blue-600 bg-blue-50',
  stripe:  'text-indigo-600 bg-indigo-50',
  smtp:    'text-orange-600 bg-orange-50',
  http:    'text-slate-600 bg-slate-100',
  custom:  'text-gray-600 bg-gray-100',
}

interface FormState {
  name:        string
  type:        CredTypeValue
  description: string
  fields:      Record<string, string>
  customJson:  string
}

const INITIAL_FORM: FormState = {
  name:       '',
  type:       'openai',
  description: '',
  fields:     {},
  customJson: '{}',
}

export const CredentialManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [creds, setCreds]       = useState<Credential[]>([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [form, setForm]         = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})

  const fetchCreds = async () => {
    setLoading(true)
    try {
      setCreds(await credentialsService.list())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCreds() }, [])

  const selectedType = CREDENTIAL_TYPES.find(t => t.value === form.type)!

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      let data: Record<string, unknown>
      if (form.type === 'custom') {
        data = JSON.parse(form.customJson)
      } else {
        data = Object.fromEntries(
          selectedType.fields.map(f => [f, form.fields[f] ?? ''])
        )
      }
      const payload: CreateCredentialPayload = {
        name:        form.name.trim(),
        type:        form.type,
        data,
        description: form.description.trim() || undefined,
      }
      await credentialsService.create(payload)
      setForm(INITIAL_FORM)
      setShowNew(false)
      await fetchCreds()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save credential')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await credentialsService.delete(id)
    setCreds(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Credential Manager</h2>
            <span className="text-xs text-slate-400 ml-1">AES-256 encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => { setShowNew(true); setForm(INITIAL_FORM); setError(null) }}>
              <Plus size={13} /> New
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* New credential form */}
        {showNew && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="My OpenAI Key"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as CredTypeValue, fields: {} }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CREDENTIAL_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.type === 'custom' ? (
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">JSON Data</label>
                <textarea
                  value={form.customJson}
                  onChange={e => setForm(f => ({ ...f, customJson: e.target.value }))}
                  rows={3}
                  className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {selectedType.fields.map(field => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">
                      {field.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <div className="relative">
                      <input
                        type={showValues[field] ? 'text' : 'password'}
                        value={form.fields[field] ?? ''}
                        onChange={e => setForm(f => ({ ...f, fields: { ...f.fields, [field]: e.target.value } }))}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowValues(v => ({ ...v, [field]: !v[field] }))}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showValues[field] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Description (optional)</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Used for production workflows"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Credential'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowNew(false); setError(null) }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Credential list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw size={18} className="text-slate-400 animate-spin" />
            </div>
          ) : creds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <Key size={28} className="mb-2 opacity-30" />
              <p className="text-sm">No credentials yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {creds.map(cred => {
                const typeColor = ICON_COLORS[cred.type as CredTypeValue] ?? 'text-slate-600 bg-slate-100'
                return (
                  <li key={cred.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColor}`}>
                      <Key size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{cred.name}</p>
                      <p className="text-xs text-slate-400">
                        {CREDENTIAL_TYPES.find(t => t.value === cred.type)?.label ?? cred.type}
                        {cred.description ? ` · ${cred.description}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-slate-300">
                      {new Date(cred.updatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
