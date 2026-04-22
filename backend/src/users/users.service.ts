import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'

interface CreateUserInput {
  email: string
  name: string
  passwordHash: string
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const user = this.repo.create({
      email:        input.email,
      name:         input.name,
      passwordHash: input.passwordHash,
    })
    return this.repo.save(user)
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } })
  }

  async setRefreshToken(id: string, token: string): Promise<void> {
    await this.repo.update(id, { refreshToken: token })
  }

  async clearRefreshToken(id: string): Promise<void> {
    await this.repo.update(id, { refreshToken: null })
  }

  async updateProfile(id: string, updates: Partial<Pick<User, 'name' | 'avatarUrl'>>): Promise<User> {
    await this.repo.update(id, updates)
    const user = await this.findById(id)
    if (!user) throw new NotFoundException('User not found')
    return user
  }
}
