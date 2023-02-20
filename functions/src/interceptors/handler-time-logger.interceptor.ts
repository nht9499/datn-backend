import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logInfo } from '../utils/logger.util';

@Injectable()
export class HandlerTimeLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const { url, method } = context.switchToHttp().getRequest<Request>();
    logInfo(`${method}:${url}`, 'Starts running...');

    const startTime = Date.now();
    return next.handle().pipe(
      tap(() => {
        logInfo(
          `${method}:${url}`,
          `Finished after ${Date.now() - startTime}ms...`
        );
      })
    );
  }
}
