import {
  Injectable, UnauthorizedException, ConflictException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { RegisterDto, TokensResponse } from './dto/auth.dto'
import { User } from '../users/entities/user.entity'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokensResponse> {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) throw new ConflictException('Email already registered')

    const user = await this.usersService.create({
      email:        dto.email,
      name:         dto.name,
      passwordHash: dto.password, // entity BeforeInsert hashes it
    })

    return this.generateTokens(user)
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email)
    if (!user || !user.isActive) return null
    const valid = await user.validatePassword(password)
    return valid ? user : null
  }

  async login(user: User): Promise<TokensResponse> {
    return this.generateTokens(user)
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokensResponse> {
    const user = await this.usersService.findById(userId)
    if (!user || !user.refreshToken) throw new UnauthorizedException()

    const match = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!match) throw new UnauthorizedException('Invalid refresh token')

    return this.generateTokens(user)
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.clearRefreshToken(userId)
  }

  private async generateTokens(user: User): Promise<TokensResponse> {
    const payload = { sub: user.id, email: user.email, role: user.role }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:    this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret:    this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpires'),
      }),
    ])

    // Store hashed refresh token
    const hashed = await bcrypt.hash(refreshToken, 10)
    await this.usersService.setRefreshToken(user.id, hashed)

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }
  }
}
