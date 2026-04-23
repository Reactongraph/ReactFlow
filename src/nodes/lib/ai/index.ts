import React from 'react'
import { Sparkles, FileText, Tag, Braces } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const MODEL_OPTIONS = [
  { value: 'gpt-4o',          label: 'GPT-4o'          },
  { value: 'gpt-4-turbo',     label: 'GPT-4 Turbo'     },
  { value: 'gpt-3.5-turbo',   label: 'GPT-3.5 Turbo'   },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-opus',   label: 'Claude 3 Opus'   },
  { value: 'custom',          label: 'Custom'           },
]

const aiNodes: NodeDefinition[] = [
  {
    type: 'ai-text-gen',
    name: 'Text Generation',
    description: 'Generate text using an LLM with a custom prompt',
    category: 'AI / LLM',
    color: 'from-purple-600 to-purple-700',
    icon: React.createElement(Sparkles, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Context', dataType: 'any'    }],
    outputs: [{ id: 'out', label: 'Text',    dataType: 'string' }],
    fields: [
      { key: 'model',       label: 'Model',          type: 'select',   options: MODEL_OPTIONS, defaultValue: 'gpt-4o' },
      { key: 'systemPrompt', label: 'System Prompt', type: 'textarea', rows: 3, placeholder: 'You are a helpful assistant.' },
      { key: 'userPrompt',  label: 'User Prompt',    type: 'textarea', rows: 5, placeholder: 'Summarize the following: {{input}}', required: true },
      { key: 'maxTokens',   label: 'Max Tokens',     type: 'number',   placeholder: '1024', defaultValue: 1024 },
      { key: 'temperature', label: 'Temperature',    type: 'number',   placeholder: '0.7',  defaultValue: 0.7, hint: '0 = deterministic, 2 = creative' },
      { key: 'topP',        label: 'Top P',          type: 'number',   placeholder: '1.0',  defaultValue: 1.0 },
    ],
    defaultConfig: { model: 'gpt-4o', maxTokens: 1024, temperature: 0.7, topP: 1.0 },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 900 + Math.random() * 900))
      return {
        text: `Generated response for: ${JSON.stringify(input).slice(0, 60)}…`,
        model: config.model,
        usage: { promptTokens: 120, completionTokens: config.maxTokens ?? 1024, totalTokens: 1144 },
        finishReason: 'stop',
      }
    },
  },
  {
    type: 'ai-summarize',
    name: 'Text Summarization',
    description: 'Summarize long text into a concise output',
    category: 'AI / LLM',
    color: 'from-violet-500 to-violet-600',
    icon: React.createElement(FileText, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Text',    dataType: 'string' }],
    outputs: [{ id: 'out', label: 'Summary', dataType: 'string' }],
    fields: [
      { key: 'model',  label: 'Model',  type: 'select',   options: MODEL_OPTIONS, defaultValue: 'gpt-4o' },
      { key: 'style',  label: 'Style',  type: 'select',   options: [
        { value: 'bullet',    label: 'Bullet Points' },
        { value: 'paragraph', label: 'Paragraph'     },
        { value: 'tldr',      label: 'TL;DR'         },
        { value: 'executive', label: 'Executive'     },
      ], defaultValue: 'paragraph' },
      { key: 'maxLength', label: 'Max Length (words)', type: 'number', placeholder: '150', defaultValue: 150 },
      { key: 'language',  label: 'Output Language',   type: 'text',   placeholder: 'English', defaultValue: 'English' },
    ],
    defaultConfig: { model: 'gpt-4o', style: 'paragraph', maxLength: 150, language: 'English' },
    executor: async (config, input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 800 + Math.random() * 700))
      return {
        summary: `Summary (${config.style}): ${String(input).slice(0, 80)}…`,
        wordCount: config.maxLength ?? 150,
        model: config.model,
      }
    },
  },
  {
    type: 'ai-classify',
    name: 'Classification',
    description: 'Classify text into predefined categories',
    category: 'AI / LLM',
    color: 'from-fuchsia-500 to-fuchsia-600',
    icon: React.createElement(Tag, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Text',   dataType: 'string' }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'object' }],
    fields: [
      { key: 'model',      label: 'Model',      type: 'select',   options: MODEL_OPTIONS, defaultValue: 'gpt-4o' },
      { key: 'categories', label: 'Categories', type: 'textarea', rows: 3,
        placeholder: 'positive\nnegative\nneutral', hint: 'One category per line', required: true },
      { key: 'multiLabel', label: 'Multi-label', type: 'boolean', hint: 'Allow multiple categories' },
      { key: 'confidence', label: 'Return Confidence', type: 'boolean', defaultValue: true },
    ],
    defaultConfig: { model: 'gpt-4o', confidence: true },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 700 + Math.random() * 600))
      const cats = String(config.categories ?? 'positive\nnegative').split('\n').filter(Boolean)
      return {
        label: cats[0] ?? 'unknown',
        confidence: 0.92,
        scores: Object.fromEntries(cats.map((c, i) => [c, i === 0 ? 0.92 : 0.08 / (cats.length - 1)])),
        model: config.model,
      }
    },
  },
  {
    type: 'ai-embedding',
    name: 'Embedding Generator',
    description: 'Generate vector embeddings for semantic search',
    category: 'AI / LLM',
    color: 'from-indigo-500 to-indigo-600',
    icon: React.createElement(Braces, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Text',      dataType: 'string' }],
    outputs: [{ id: 'out', label: 'Embedding', dataType: 'array'  }],
    fields: [
      { key: 'model', label: 'Embedding Model', type: 'select', options: [
        { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
        { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
        { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002' },
      ], defaultValue: 'text-embedding-3-small' },
      { key: 'dimensions', label: 'Dimensions', type: 'number', placeholder: '1536', defaultValue: 1536, hint: 'Vector size' },
      { key: 'normalize',  label: 'Normalize',  type: 'boolean', defaultValue: true },
    ],
    defaultConfig: { model: 'text-embedding-3-small', dimensions: 1536, normalize: true },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400))
      const dims = (config.dimensions as number) ?? 1536
      return {
        embedding: Array.from({ length: Math.min(dims, 8) }, () => Math.random() * 2 - 1),
        dimensions: dims,
        model: config.model,
        truncated: dims > 8,
      }
    },
  },
]

aiNodes.forEach(registerNode)
