import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { WorkflowRun } from './workflow-run.entity'

export type LogLevel = 'info' | 'success' | 'error' | 'warning' | 'debug'

@Entity('execution_logs')
@Index(['runId'])
@Index(['nodeId'])
export class ExecutionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'run_id' })
  runId: string

  @ManyToOne(() => WorkflowRun, run => run.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'run_id' })
  run: WorkflowRun

  @Column({ name: 'node_id', type: 'varchar', nullable: true, length: 255 })
  nodeId: string | null

  @Column({ name: 'node_label', type: 'varchar', nullable: true, length: 255 })
  nodeLabel: string | null

  @Column({ type: 'varchar', default: 'info' })
  level: LogLevel

  @Column({ type: 'text' })
  message: string

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
