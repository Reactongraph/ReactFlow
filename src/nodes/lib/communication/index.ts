import React from 'react'
import { Mail, MessageSquare, Hash, Bell } from 'lucide-react'
import { registerNode } from '../../registry'
import { NodeDefinition } from '../../registry/types'

const commNodes: NodeDefinition[] = [
  {
    type: 'comm-email',
    name: 'Email Sender',
    description: 'Send an email via SMTP or a transactional provider',
    category: 'Communication',
    color: 'from-blue-500 to-blue-600',
    icon: React.createElement(Mail, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Data',   dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'object' }],
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: [
        { value: 'smtp',      label: 'SMTP'      },
        { value: 'sendgrid',  label: 'SendGrid'  },
        { value: 'mailgun',   label: 'Mailgun'   },
        { value: 'ses',       label: 'AWS SES'   },
        { value: 'resend',    label: 'Resend'    },
      ], defaultValue: 'smtp' },
      { key: 'apiKey',  label: 'API Key / SMTP URL', type: 'password', placeholder: 'sk-...' },
      { key: 'from',    label: 'From',    type: 'text',     placeholder: 'noreply@example.com', required: true },
      { key: 'to',      label: 'To',      type: 'text',     placeholder: 'user@example.com (supports {{variables}})', required: true },
      { key: 'subject', label: 'Subject', type: 'text',     placeholder: 'Hello {{name}}!', required: true },
      { key: 'body',    label: 'Body',    type: 'textarea', rows: 5, placeholder: 'Hi {{name}},\n\nYour order {{orderId}} is ready.' },
      { key: 'html',    label: 'HTML Body', type: 'code',   rows: 6, placeholder: '<h1>Hello {{name}}</h1>' },
      { key: 'cc',      label: 'CC',      type: 'text',     placeholder: 'manager@example.com' },
    ],
    defaultConfig: { provider: 'smtp' },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 300 + Math.random() * 400))
      return { sent: true, to: config.to, subject: config.subject, provider: config.provider, messageId: `msg-${Date.now()}` }
    },
  },
  {
    type: 'comm-slack',
    name: 'Slack Message',
    description: 'Post a message to a Slack channel or user',
    category: 'Communication',
    color: 'from-purple-500 to-purple-600',
    icon: React.createElement(MessageSquare, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Data',   dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'object' }],
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL',  type: 'password', placeholder: 'https://hooks.slack.com/services/...', required: true },
      { key: 'channel',    label: 'Channel',      type: 'text',     placeholder: '#general or @username' },
      { key: 'text',       label: 'Message Text', type: 'textarea', rows: 3, placeholder: 'Workflow completed: {{status}}', required: true },
      { key: 'username',   label: 'Bot Username', type: 'text',     placeholder: 'WorkflowBot' },
      { key: 'iconEmoji',  label: 'Icon Emoji',   type: 'text',     placeholder: ':robot_face:' },
      { key: 'blocks',     label: 'Block Kit JSON', type: 'json',   rows: 5, hint: 'Advanced Slack Block Kit layout' },
    ],
    defaultConfig: {},
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
      return { ok: true, channel: config.channel, ts: `${Date.now()}.000100` }
    },
  },
  {
    type: 'comm-discord',
    name: 'Discord Message',
    description: 'Send a message to a Discord channel via webhook',
    category: 'Communication',
    color: 'from-indigo-500 to-indigo-600',
    icon: React.createElement(Hash, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Data',   dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'object' }],
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'password', placeholder: 'https://discord.com/api/webhooks/...', required: true },
      { key: 'content',    label: 'Message',     type: 'textarea', rows: 3, placeholder: 'Workflow alert: {{message}}', required: true },
      { key: 'username',   label: 'Username',    type: 'text',     placeholder: 'WorkflowBot' },
      { key: 'avatarUrl',  label: 'Avatar URL',  type: 'url',      placeholder: 'https://example.com/avatar.png' },
      { key: 'embeds',     label: 'Embeds JSON', type: 'json',     rows: 5, hint: 'Discord embed objects array' },
    ],
    defaultConfig: {},
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
      return { ok: true, id: `${Date.now()}`, content: config.content }
    },
  },
  {
    type: 'comm-push',
    name: 'Push Notification',
    description: 'Send a push notification via FCM or APNs',
    category: 'Communication',
    color: 'from-rose-500 to-rose-600',
    icon: React.createElement(Bell, { size: 13 }),
    inputs:  [{ id: 'in',  label: 'Data',   dataType: 'any' }],
    outputs: [{ id: 'out', label: 'Result', dataType: 'object' }],
    fields: [
      { key: 'provider', label: 'Provider', type: 'select', options: [
        { value: 'fcm',   label: 'Firebase FCM' },
        { value: 'apns',  label: 'Apple APNs'   },
        { value: 'expo',  label: 'Expo Push'    },
        { value: 'onesignal', label: 'OneSignal' },
      ], defaultValue: 'fcm' },
      { key: 'apiKey',  label: 'API Key / Server Key', type: 'password', required: true },
      { key: 'token',   label: 'Device Token / Topic', type: 'text',     placeholder: 'device-token or /topics/all', required: true },
      { key: 'title',   label: 'Title',   type: 'text',     placeholder: 'Notification title', required: true },
      { key: 'body',    label: 'Body',    type: 'textarea', rows: 2, placeholder: 'Notification body text' },
      { key: 'data',    label: 'Data Payload', type: 'json', rows: 3, placeholder: '{"orderId": "123"}' },
      { key: 'badge',   label: 'Badge Count', type: 'number', placeholder: '1' },
    ],
    defaultConfig: { provider: 'fcm' },
    executor: async (config, _input, ctx) => {
      if (ctx.signal.aborted) throw new Error('Aborted')
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
      return { sent: true, provider: config.provider, messageId: `push-${Date.now()}`, token: config.token }
    },
  },
]

commNodes.forEach(registerNode)
