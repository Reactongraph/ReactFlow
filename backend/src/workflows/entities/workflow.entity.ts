import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne,
  OneToMany, JoinColumn, Index,
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

export interface WorkflowNodeData {
  id: string
  type: string
  label: string
  position: { x: number; y: number }
  data: Record<string, unknown>
  config?: Record<string, unknown>
}

export interface WorkflowEdgeData {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  type?: string
}

export interface WorkflowSettings {
  retryOnFailure?: boolean
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  notifyOnFailure?: boolean
  notifyEmail?: string
}

@Entity('workflows')
@Index(['userId'])
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]

  // Nodes and edges stored as JSONB — denormalized for fast load
  @Column({ type: 'jsonb', default: [] })
  nodes: WorkflowNodeData[]

  @Column({ type: 'jsonb', default: [] })
  edges: WorkflowEdgeData[]

  @Column({ type: 'jsonb', default: {} })
  settings: WorkflowSettings

  // Cached stats updated on each run
  @Column({ name: 'last_run_at', type: 'timestamptz', nullable: true })
  lastRunAt: Date | null

  @Column({ name: 'last_run_status', type: 'varchar', nullable: true, length: 50 })
  lastRunStatus: string | null

  @Column({ name: 'total_runs', default: 0 })
  totalRuns: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
