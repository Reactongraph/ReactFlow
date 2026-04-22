import {
  Controller, Post, Body, UseGuards, Get,
  HttpCode, HttpStatus, Req,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Public, JwtAuthGuard } from './guards/jwt-auth.guard'
import { User } from '../users/entities/user.entity'

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60, limit: 5 } })
  @ApiOperation({ summary: 'Register a new account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60, limit: 10 } })
  @ApiOperation({ summary: 'Login with email + password' })
  login(@Req() req: { user: User }) {
    return this.authService.login(req.user)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto & { userId: string }) {
    return this.authService.refreshTokens(dto.userId, dto.refreshToken)
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id)
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  me(@CurrentUser() user: User) {
    return { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl }
  }
}
