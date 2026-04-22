import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import { ConfigService } from '@nestjs/config'
import { BaseNodeHandler, NodeExecutionContext, NodeHandlerOutput } from './base.handler'

@Injectable()
export class EmailHandler extends BaseNodeHandler {
  readonly nodeType = 'output'
  private transporter: nodemailer.Transporter

  constructor(private readonly config: ConfigService) {
    super()
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('smtp.host'),
      port: config.get<number>('smtp.port'),
      auth: {
        user: config.get<string>('smtp.user'),
        pass: config.get<string>('smtp.pass'),
      },
    })
  }

  async execute(ctx: NodeExecutionContext): Promise<NodeHandlerOutput> {
    const to      = this.cfg<string>(ctx, 'to', '')
    const subject = this.cfg<string>(ctx, 'subject', 'Workflow Output')
    const body    = this.cfg<string>(ctx, 'body', '')
    const from    = this.config.get<string>('smtp.from')

    const input   = this.primaryInput(ctx)
    const htmlBody = body
      ? this.interpolate(body, { input: JSON.stringify(input, null, 2), ...ctx.inputData as Record<string, string> })
      : `<pre>${JSON.stringify(input, null, 2)}</pre>`

    if (!to) {
      await ctx.logger.warn('No recipient — output node in display-only mode')
      return { data: input }
    }

    await ctx.logger.info(`Sending email to ${to}`)
    await this.transporter.sendMail({ from, to, subject, html: htmlBody })
    await ctx.logger.success(`Email sent to ${to}`)

    return { data: { sent: true, to, subject, timestamp: new Date().toISOString() } }
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
  }
}
