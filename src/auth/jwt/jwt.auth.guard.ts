import { Injectable, ExecutionContext, UnauthorizedException, HttpException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { log } from 'console';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    
    // Check if the token is expired
    if (info && info.name === 'TokenExpiredError') {
      log('Token expired:', info);
      throw new HttpException('Token expired', 401);
    }

    // Handle other errors or missing user
    if (err || !user) {
      if (info && info.name === 'JsonWebTokenError') {
        log('Invalid Token:', info);
        throw new HttpException('Invalid token', 401);
      }
      log(err, user, info, context);
      throw err || new UnauthorizedException();
    }

    // Attach userId to request object
    request.user = user;
    return user;
  }
}
