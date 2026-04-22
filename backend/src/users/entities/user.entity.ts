import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate,
} from 'typeorm'
import * as bcrypt from 'bcrypt'
import { Exclude } from 'class-transformer'

export type UserRole = 'admin' | 'user' | 'viewer'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ length: 255 })
  name: string

  @Column({ name: 'password_hash', length: 255 })
  @Exclude()
  passwordHash: string

  @Column({ type: 'varchar', default: 'user' })
  role: UserRole

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ name: 'refresh_token', nullable: true, type: 'text' })
  @Exclude()
  refreshToken: string | null

  @Column({ name: 'avatar_url', nullable: true, type: 'text' })
  avatarUrl: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
    }
  }

  async validatePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.passwordHash)
  }
}
