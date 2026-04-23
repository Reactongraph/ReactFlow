import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm'
import { Workflow } from '../../workflows/entities/workflow.entity'

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'workflow_id' })
  workflowId: string

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow

  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null

  @Column({ name: 'cron_expression', length: 100 })
  cronExpression: string

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean

  @Column({ name: 'label', type: 'varchar', nullable: true, length: 255 })
  label: string | null

  @Column({ name: 'last_run_at', type: 'timestamptz', nullable: true })
  lastRunAt: Date | null

  @Column({ name: 'next_run_at', type: 'timestamptz', nullable: true })
  nextRunAt: Date | null

  @Column({ name: 'run_count', default: 0 })
  runCount: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
