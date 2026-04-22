import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { Workflow } from '../../workflows/entities/workflow.entity'

@Entity('webhooks')
@Index(['token'], { unique: true })
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'workflow_id' })
  workflowId: string

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string

  @Column({ type: 'varchar', length: 64, unique: true })
  token: string

  @Column({ type: 'varchar', nullable: true, length: 255 })
  description: string | null

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ name: 'hit_count', default: 0 })
  hitCount: number

  @Column({ name: 'last_triggered_at', type: 'timestamptz', nullable: true })
  lastTriggeredAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
