import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret')!,
      passReqToCallback: true,
    } as any);
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    const authorizationHeader = req.get('Authorization');
    const refreshToken = authorizationHeader
      ? authorizationHeader.replace('Bearer', '').trim()
      : '';
    return { id: payload.sub, email: payload.email, refreshToken };
  }
}
