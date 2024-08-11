import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => {
        let token = null;
        if (req && req.cookies) {
          token = req.cookies['token'];
        }
        return token;
      }]),
      ignoreExpiration: false,
      secretOrKey: Buffer.from('eW91ci0yNTYtYml0LXNlY3JldA==', 'base64').toString('ascii'),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.id,
      email: payload.email,
      fullName: payload.fullName,
      roles: payload.roles,
    };
  }
}
