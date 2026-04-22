import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { Workflow } from './workflow.entity'

@Entity('workflow_versions')
@Index(['workflowId'])
export class WorkflowVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'workflow_id' })
  workflowId: string

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null

  @Column({ type: 'text', nullable: true })
  description: string | null

  // Full snapshot: { nodes, edges, settings }
  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>

  @Column({ name: 'node_count', default: 0 })
  nodeCount: number

  @Column({ name: 'edge_count', default: 0 })
  edgeCount: number

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  createdBy: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
