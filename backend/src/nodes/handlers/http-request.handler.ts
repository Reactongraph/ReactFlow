import { Injectable } from '@nestjs/common'
import axios, { AxiosRequestConfig, Method } from 'axios'
import { BaseNodeHandler, NodeExecutionContext, NodeHandlerOutput } from './base.handler'

@Injectable()
export class HttpRequestHandler extends BaseNodeHandler {
  readonly nodeType = 'api'

  async execute(ctx: NodeExecutionContext): Promise<NodeHandlerOutput> {
    const url     = this.cfg<string>(ctx, 'url', '')
    const method  = this.cfg<Method>(ctx, 'method', 'GET')
    const timeout = this.cfg<number>(ctx, 'timeout', 30_000)

    let headers: Record<string, string> = {}
    let body: unknown = undefined

    // Parse headers (stored as JSON string or object)
    try {
      const raw = this.cfg<string | Record<string, string>>(ctx, 'headers', '')
      headers = typeof raw === 'string' && raw ? JSON.parse(raw) : (raw ?? {})
    } catch { headers = {} }

    // Interpolate body with upstream data
    try {
      const rawBody = this.cfg<string | unknown>(ctx, 'body', '')
      if (rawBody) {
        body = typeof rawBody === 'string'
          ? JSON.parse(this.interpolate(rawBody, ctx.inputData))
          : rawBody
      }
    } catch { /* body remains undefined */ }

    if (!url) throw new Error('HTTP Request node: URL is required')

    await ctx.logger.info(`${method} ${url}`)

    const config: AxiosRequestConfig = {
      method,
      url,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout,
      validateStatus: () => true, // we handle status ourselves
    }
    if (body !== undefined) config.data = body

    const resp = await axios(config)

    await ctx.logger.info(`Response: ${resp.status} ${resp.statusText}`)

    if (resp.status >= 400) {
      throw new Error(`HTTP ${resp.status}: ${JSON.stringify(resp.data).slice(0, 200)}`)
    }

    return {
      data: {
        status:     resp.status,
        statusText: resp.statusText,
        headers:    resp.headers,
        body:       resp.data,
      },
    }
  }

  /** Simple {{key}} interpolation using inputData */
  private interpolate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      data[key] !== undefined ? String(data[key]) : `{{${key}}}`,
    )
  }
}
