import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLog, AuditAction } from './entities/audit-log.entity'

export interface LogOptions {
  userId?:      string | null
  userEmail?:   string | null
  resourceId?:  string | null
  resourceType?: string | null
  metadata?:    Record<string, unknown>
  ipAddress?:   string | null
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(action: AuditAction, opts: LogOptions = {}): Promise<void> {
    await this.repo.save(
      this.repo.create({
        action,
        userId:       opts.userId       ?? null,
        userEmail:    opts.userEmail    ?? null,
        resourceId:   opts.resourceId   ?? null,
        resourceType: opts.resourceType ?? null,
        metadata:     opts.metadata     ?? null,
        ipAddress:    opts.ipAddress    ?? null,
      }),
    )
  }

  async query(filters: {
    userId?:  string
    action?:  AuditAction
    fromDate?: Date
    toDate?:  Date
    limit?:   number
    offset?:  number
  }): Promise<{ data: AuditLog[]; total: number }> {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.createdAt', 'DESC')

    if (filters.userId)   qb.andWhere('a.userId = :userId',     { userId:   filters.userId })
    if (filters.action)   qb.andWhere('a.action = :action',     { action:   filters.action })
    if (filters.fromDate) qb.andWhere('a.createdAt >= :from',   { from:     filters.fromDate })
    if (filters.toDate)   qb.andWhere('a.createdAt <= :to',     { to:       filters.toDate })

    const limit  = Math.min(filters.limit  ?? 50, 200)
    const offset = filters.offset ?? 0

    const [data, total] = await qb.limit(limit).offset(offset).getManyAndCount()
    return { data, total }
  }
}
