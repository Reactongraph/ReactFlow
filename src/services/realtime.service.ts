import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001/ws'

type EventHandler = (data: unknown) => void

class RealtimeService {
  private socket: Socket | null = null
  private handlers = new Map<string, Set<EventHandler>>()

  connect(token: string): void {
    if (this.socket?.connected) return

    this.socket = io(WS_URL, {
      auth:            { token },
      transports:      ['websocket'],
      reconnection:    true,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => console.log('[WS] Connected'))
    this.socket.on('disconnect', () => console.log('[WS] Disconnected'))
    this.socket.on('connect_error', (e) => console.warn('[WS] Error:', e.message))

    // Route all events to registered handlers
    const events = [
      'run:started', 'run:completed', 'run:failed',
      'node:started', 'node:completed', 'node:failed',
      'workflow:saved',
      'collaborator:joined', 'collaborator:left',
      'nodes:change', 'cursor:move', 'node:select',
    ]
    for (const event of events) {
      this.socket.on(event, (data: unknown) => {
        this.handlers.get(event)?.forEach(h => h(data))
      })
    }
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  joinWorkflow(workflowId: string): void {
    this.socket?.emit('workflow:join', { workflowId })
  }

  leaveWorkflow(): void {
    this.socket?.emit('workflow:leave')
  }

  sendNodeChanges(workflowId: string, changes: unknown[]): void {
    this.socket?.emit('nodes:change', { workflowId, changes })
  }

  sendCursor(workflowId: string, x: number, y: number): void {
    this.socket?.emit('cursor:move', { workflowId, x, y })
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return () => this.handlers.get(event)?.delete(handler)
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const realtimeService = new RealtimeService()
