import React from 'react'
import { Upload, Download, FileText, Image } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const fileNodes: NodeDefinition[] = [
  {
    type: 'file-upload',
    name: 'File Upload',
    description: 'Upload a file to cloud storage (S3, GCS, Azure)',
    category: 'Files',
    color: 'from-violet-500 to-violet-600',
    icon: React.createElement(Upload, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'File',   dataType: 'file'   }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'object' }],
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: [
        { value: 's3',    label: 'AWS S3'         },
        { value: 'gcs',   label: 'Google Cloud'   },
        { value: 'azure', label: 'Azure Blob'     },
        { value: 'local', label: 'Local Disk'     },
      ], defaultValue: 's3' },
      { key: 'bucket',      label: 'Bucket / Container', type: 'text',     placeholder: 'my-bucket', required: true },
      { key: 'path',        label: 'Destination Path',   type: 'text',     placeholder: 'uploads/{{filename}}' },
      { key: 'credentials', label: 'Credentials',        type: 'password', placeholder: 'Access key or JSON' },
      { key: 'public',      label: 'Public Access',      type: 'boolean',  defaultValue: false },
      { key: 'overwrite',   label: 'Overwrite Existing', type: 'boolean',  defaultValue: true  },
    ],
    defaultConfig: { provider: 's3', public: false, overwrite: true },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600))
      return {
        url: `https://${config.bucket}.s3.amazonaws.com/${config.path ?? 'file'}`,
        bucket: config.bucket,
        key: config.path,
        size: 204800,
        etag: `"${Math.random().toString(36).slice(2)}"`,
      }
    },
  },
  {
    type: 'file-download',
    name: 'File Download',
    description: 'Download a file from a URL or cloud storage',
    category: 'Files',
    color: 'from-blue-500 to-blue-600',
    icon: React.createElement(Download, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'URL',  dataType: 'string' }],
    outputs: [{ id: 'out', label: 'File', dataType: 'file'   }],
    fields: [
      { key: 'url',         label: 'URL',              type: 'url',      placeholder: 'https://example.com/file.pdf', required: true },
      { key: 'filename',    label: 'Save As',          type: 'text',     placeholder: 'document.pdf' },
      { key: 'headers',     label: 'Request Headers',  type: 'json',     rows: 2, placeholder: '{"Authorization": "Bearer ..."}' },
      { key: 'timeout',     label: 'Timeout (ms)',     type: 'number',   placeholder: '30000', defaultValue: 30000 },
    ],
    defaultConfig: { timeout: 30000 },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 500 + Math.random() * 700))
      return {
        filename: config.filename ?? 'download',
        url: config.url,
        size: 512000,
        mimeType: 'application/octet-stream',
        downloadedAt: new Date().toISOString(),
      }
    },
  },
  {
    type: 'file-pdf',
    name: 'PDF Parser',
    description: 'Extract text and metadata from a PDF file',
    category: 'Files',
    color: 'from-red-500 to-red-600',
    icon: React.createElement(FileText, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'PDF File', dataType: 'file'   }],
    outputs: [{ id: 'out', label: 'Content',  dataType: 'object' }],
    fields: [
      { key: 'extractText',     label: 'Extract Text',     type: 'boolean', defaultValue: true  },
      { key: 'extractMetadata', label: 'Extract Metadata', type: 'boolean', defaultValue: true  },
      { key: 'extractImages',   label: 'Extract Images',   type: 'boolean', defaultValue: false },
      { key: 'pageRange',       label: 'Page Range',       type: 'text',    placeholder: '1-10 or leave blank for all' },
      { key: 'ocrEnabled',      label: 'Enable OCR',       type: 'boolean', defaultValue: false, hint: 'For scanned PDFs' },
    ],
    defaultConfig: { extractText: true, extractMetadata: true, extractImages: false, ocrEnabled: false },
    executor: async (_config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800))
      return {
        text: 'Extracted PDF text content goes here...',
        pages: 5,
        metadata: { title: 'Document', author: 'Author', createdAt: '2024-01-01' },
        wordCount: 1240,
      }
    },
  },
  {
    type: 'file-image',
    name: 'Image Processor',
    description: 'Resize, crop, convert, or analyze images',
    category: 'Files',
    color: 'from-pink-500 to-pink-600',
    icon: React.createElement(Image, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Image',  dataType: 'file'   }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'object' }],
    fields: [
      { key: 'operation', label: 'Operation', type: 'select', options: [
        { value: 'resize',    label: 'Resize'    }, { value: 'crop',      label: 'Crop'      },
        { value: 'convert',   label: 'Convert'   }, { value: 'compress',  label: 'Compress'  },
        { value: 'thumbnail', label: 'Thumbnail' }, { value: 'analyze',   label: 'Analyze'   },
      ], defaultValue: 'resize' },
      { key: 'width',   label: 'Width (px)',  type: 'number', placeholder: '800'  },
      { key: 'height',  label: 'Height (px)', type: 'number', placeholder: '600'  },
      { key: 'format',  label: 'Output Format', type: 'select', options: [
        { value: 'jpeg', label: 'JPEG' }, { value: 'png', label: 'PNG' },
        { value: 'webp', label: 'WebP' }, { value: 'avif', label: 'AVIF' },
      ], defaultValue: 'jpeg' },
      { key: 'quality', label: 'Quality (1-100)', type: 'number', placeholder: '85', defaultValue: 85 },
      { key: 'fit',     label: 'Fit Mode', type: 'select', options: [
        { value: 'cover',    label: 'Cover'    }, { value: 'contain', label: 'Contain' },
        { value: 'fill',     label: 'Fill'     }, { value: 'inside',  label: 'Inside'  },
      ], defaultValue: 'cover' },
    ],
    defaultConfig: { operation: 'resize', format: 'jpeg', quality: 85, fit: 'cover' },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600))
      return {
        operation: config.operation,
        width: config.width ?? 800,
        height: config.height ?? 600,
        format: config.format,
        size: 102400,
        url: 'https://storage.example.com/processed-image.jpg',
      }
    },
  },
]

fileNodes.forEach(registerNode)
