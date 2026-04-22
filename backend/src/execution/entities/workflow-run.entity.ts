import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
  OneToMany, Index,
} from 'typeorm'
import { Workflow } from '../../workflows/entities/workflow.entity'
import { User } from '../../users/entities/user.entity'
import { ExecutionLog } from './execution-log.entity'

export type RunStatus    = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused'
export type TriggerType  = 'manual' | 'webhook' | 'scheduled' | 'api'

export interface NodeRunResult {
  nodeId: string
  nodeLabel: string
  status: 'success' | 'error' | 'skipped'
  input?: unknown
  output?: unknown
  error?: string
  durationMs: number
  startedAt: string
}

@Entity('workflow_runs')
@Index(['workflowId'])
@Index(['userId'])
@Index(['status'])
export class WorkflowRun {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'workflow_id' })
  workflowId: string

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow

  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null

  @Column({ type: 'varchar', default: 'pending' })
  status: RunStatus

  @Column({ name: 'trigger_type', type: 'varchar', default: 'manual' })
  triggerType: TriggerType

  @Column({ name: 'trigger_data', type: 'jsonb', nullable: true })
  triggerData: Record<string, unknown> | null

  // Per-node results map
  @Column({ name: 'node_results', type: 'jsonb', default: {} })
  nodeResults: Record<string, NodeRunResult>

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null

  @Column({ name: 'node_count', default: 0 })
  nodeCount: number

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number

  @OneToMany(() => ExecutionLog, log => log.run, { cascade: true })
  logs: ExecutionLog[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
