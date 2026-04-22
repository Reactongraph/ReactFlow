import {
  Injectable, NotFoundException, ForbiddenException, OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { Credential, CredentialType } from './entities/credential.entity'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12  // GCM recommended

@Injectable()
export class CredentialsService implements OnModuleInit {
  private key!: Buffer

  constructor(
    @InjectRepository(Credential)
    private readonly repo: Repository<Credential>,
    private readonly cfg: ConfigService,
  ) {}

  onModuleInit() {
    const secret = this.cfg.get<string>('jwt.secret') ?? 'fallback-dev-key'
    // Derive a 32-byte key from the JWT secret so no extra env var is needed
    this.key = scryptSync(secret, 'credential-salt', 32)
  }

  // ── Encryption helpers ────────────────────────────────────────

  private encrypt(data: Record<string, unknown>): string {
    const iv = randomBytes(IV_LEN)
    const cipher = createCipheriv(ALGO, this.key, iv)
    const plain = JSON.stringify(data)
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()
    return JSON.stringify({
      iv:         iv.toString('hex'),
      authTag:    authTag.toString('hex'),
      ciphertext: ciphertext.toString('hex'),
    })
  }

  decrypt(encryptedData: string): Record<string, unknown> {
    const { iv, authTag, ciphertext } = JSON.parse(encryptedData)
    const decipher = createDecipheriv(ALGO, this.key, Buffer.from(iv, 'hex'))
    decipher.setAuthTag(Buffer.from(authTag, 'hex'))
    const plain = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'hex')),
      decipher.final(),
    ])
    return JSON.parse(plain.toString('utf8'))
  }

  // ── CRUD ─────────────────────────────────────────────────────

  async create(
    userId: string,
    name: string,
    type: CredentialType,
    data: Record<string, unknown>,
    description?: string,
  ): Promise<Omit<Credential, 'encryptedData'>> {
    const encryptedData = this.encrypt(data)
    const cred = await this.repo.save(
      this.repo.create({ userId, name, type, encryptedData, description: description ?? null }),
    )
    const { encryptedData: _, ...safe } = cred
    return safe
  }

  async list(userId: string): Promise<Omit<Credential, 'encryptedData'>[]> {
    const creds = await this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } })
    return creds.map(({ encryptedData: _, ...safe }) => safe)
  }

  async getDecrypted(id: string, userId: string): Promise<Record<string, unknown>> {
    const cred = await this.findOwned(id, userId)
    return this.decrypt(cred.encryptedData)
  }

  async update(
    id: string,
    userId: string,
    data: Record<string, unknown>,
    name?: string,
    description?: string,
  ): Promise<void> {
    await this.findOwned(id, userId)
    await this.repo.update(id, {
      encryptedData: this.encrypt(data),
      ...(name        !== undefined && { name }),
      ...(description !== undefined && { description }),
    })
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOwned(id, userId)
    await this.repo.delete(id)
  }

  private async findOwned(id: string, userId: string): Promise<Credential> {
    const cred = await this.repo.findOne({ where: { id } })
    if (!cred) throw new NotFoundException('Credential not found')
    if (cred.userId !== userId) throw new ForbiddenException()
    return cred
  }
}
