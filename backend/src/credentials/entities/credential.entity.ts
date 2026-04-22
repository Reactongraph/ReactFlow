import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm'

export type CredentialType =
  | 'openai' | 'slack' | 'google' | 'stripe' | 'smtp' | 'http' | 'custom'

@Entity('credentials')
@Index(['userId'])
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'varchar', length: 50 })
  type: CredentialType

  // AES-256-GCM encrypted JSON blob: { iv, authTag, ciphertext }
  @Column({ name: 'encrypted_data', type: 'text' })
  encryptedData: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
