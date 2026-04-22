import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger, UseGuards } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

interface CollaboratorCursor {
  userId: string
  name:   string
  x:      number
  y:      number
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/ws',
})
export class WorkflowGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(WorkflowGateway.name)
  /** Map socket.id → { userId, workflowId } */
  private readonly clients = new Map<string, { userId: string; workflowId?: string; name: string }>()

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Connection lifecycle ──────────────────────────────────────

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth['token'] as string | undefined
    if (!token) { socket.disconnect(); return }

    try {
      const payload = this.jwt.verify<{ sub: string; email: string; name?: string }>(
        token, { secret: this.config.get<string>('jwt.secret') },
      )
      this.clients.set(socket.id, { userId: payload.sub, name: payload.email })
      this.logger.log(`Client connected: ${socket.id} (user: ${payload.sub})`)
    } catch {
      socket.disconnect()
    }
  }

  handleDisconnect(socket: Socket) {
    const client = this.clients.get(socket.id)
    if (client?.workflowId) {
      socket.to(`workflow:${client.workflowId}`).emit('collaborator:left', { userId: client.userId })
    }
    this.clients.delete(socket.id)
    this.logger.log(`Client disconnected: ${socket.id}`)
  }

  // ── Workflow room management ───────────────────────────────────

  @SubscribeMessage('workflow:join')
  handleJoin(@MessageBody() data: { workflowId: string }, @ConnectedSocket() socket: Socket) {
    const client = this.clients.get(socket.id)
    if (!client) return

    // Leave previous room if any
    if (client.workflowId) socket.leave(`workflow:${client.workflowId}`)

    client.workflowId = data.workflowId
    socket.join(`workflow:${data.workflowId}`)

    // Notify others
    socket.to(`workflow:${data.workflowId}`).emit('collaborator:joined', {
      userId: client.userId,
      name:   client.name,
    })

    this.logger.log(`User ${client.userId} joined workflow ${data.workflowId}`)
    return { event: 'workflow:joined', data: { workflowId: data.workflowId } }
  }

  @SubscribeMessage('workflow:leave')
  handleLeave(@ConnectedSocket() socket: Socket) {
    const client = this.clients.get(socket.id)
    if (!client?.workflowId) return

    socket.to(`workflow:${client.workflowId}`).emit('collaborator:left', { userId: client.userId })
    socket.leave(`workflow:${client.workflowId}`)
    client.workflowId = undefined
  }

  // ── Collaborative editing events ──────────────────────────────

  @SubscribeMessage('nodes:change')
  handleNodeChange(
    @MessageBody() data: { workflowId: string; changes: unknown[] },
    @ConnectedSocket() socket: Socket,
  ) {
    const client = this.clients.get(socket.id)
    // Broadcast to everyone else in the room
    socket.to(`workflow:${data.workflowId}`).emit('nodes:change', {
      userId:  client?.userId,
      changes: data.changes,
    })
  }

  @SubscribeMessage('cursor:move')
  handleCursor(
    @MessageBody() data: { workflowId: string; x: number; y: number },
    @ConnectedSocket() socket: Socket,
  ) {
    const client = this.clients.get(socket.id)
    socket.to(`workflow:${data.workflowId}`).emit('cursor:move', {
      userId: client?.userId,
      name:   client?.name,
      x:      data.x,
      y:      data.y,
    })
  }

  @SubscribeMessage('node:select')
  handleNodeSelect(
    @MessageBody() data: { workflowId: string; nodeId: string | null },
    @ConnectedSocket() socket: Socket,
  ) {
    const client = this.clients.get(socket.id)
    socket.to(`workflow:${data.workflowId}`).emit('node:select', {
      userId: client?.userId,
      nodeId: data.nodeId,
    })
  }

  // ── Execution event emitter (called by WorkflowEngine) ───────

  emitExecutionEvent(workflowId: string, event: string, data: unknown): void {
    this.server.to(`workflow:${workflowId}`).emit(event, data)
  }

  // ── Broadcast workflow update (save) ──────────────────────────

  broadcastWorkflowSaved(workflowId: string, userId: string, snapshot: unknown): void {
    this.server.to(`workflow:${workflowId}`).emit('workflow:saved', {
      savedBy:  userId,
      snapshot,
      savedAt:  new Date().toISOString(),
    })
  }
}
