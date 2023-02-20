import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { CustomServerError } from '../exceptions/custom-server.exception';
import { decodeFirebaseTokenFromRequest } from '../utils/firebase-auth.util';
import { logError } from '../utils/logger.util';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    return await this.validateRequest(request);
  }

  private async validateRequest(request: Request): Promise<boolean> {
    try {
      await decodeFirebaseTokenFromRequest(request);
      return true;
    } catch (error) {
      logError(request.url, 'Unauthorized');
      throw new CustomServerError({ message: 'auth/unauthorized' });
    }
  }
}
