import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

export type AuditAction =
  | 'workflow.created' | 'workflow.updated' | 'workflow.deleted'
  | 'workflow.executed' | 'workflow.version_saved' | 'workflow.version_restored'
  | 'credential.created' | 'credential.deleted'
  | 'webhook.created' | 'webhook.triggered' | 'webhook.deleted'
  | 'user.login' | 'user.logout' | 'user.registered'

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'varchar', nullable: true })
  userId: string | null

  @Column({ name: 'user_email', type: 'varchar', nullable: true, length: 255 })
  userEmail: string | null

  @Column({ type: 'varchar', length: 100 })
  action: AuditAction

  @Column({ name: 'resource_id', type: 'varchar', nullable: true })
  resourceId: string | null

  @Column({ name: 'resource_type', type: 'varchar', nullable: true, length: 50 })
  resourceType: string | null

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null

  @Column({ name: 'ip_address', type: 'varchar', nullable: true, length: 50 })
  ipAddress: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
