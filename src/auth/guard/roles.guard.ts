import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const handler = context.getHandler().name;
    const executor = `[${user.fullName}][RolesGuard][${handler}]`;

    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    
    if (!roles) {
      return true; 
    }

    const hasRole = () => roles.some((role) => user.roles?.includes(role));

    if (!user || !user.roles) {
      this.logger.error(`${executor} Access denied. Reason: User does not have any roles.`);
      throw new HttpException('Pengguna tidak memiliki role yang diizinkan untuk mengakses resource ini', HttpStatus.FORBIDDEN);
    }

    if (!hasRole()) {
      // Menentukan peran yang hilang dan memberikan pesan yang lebih informatif
      const missingRoles = roles.filter(role => !user.roles.includes(role));
      const missingRolesString = missingRoles.join(', ');

      this.logger.error(`${executor} Access denied. Required roles: ${missingRolesString}. User roles: ${user.roles.join(', ')}`);
      
      throw new HttpException(
        `Akses ditolak. Role yang diperlukan: ${missingRolesString}. Anda memiliki role: ${user.roles.join(', ')}`,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
