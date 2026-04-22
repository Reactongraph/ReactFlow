import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { AuthService }     from './auth.service'
import { AuthController }  from './auth.controller'
import { JwtStrategy }     from './strategies/jwt.strategy'
import { LocalStrategy }   from './strategies/local.strategy'
import { JwtAuthGuard }    from './guards/jwt-auth.guard'
import { UsersModule }     from '../users/users.module'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret:      cfg.get<string>('jwt.secret'),
        signOptions: { expiresIn: cfg.get<string>('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    // Protect all routes globally — mark public with @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
