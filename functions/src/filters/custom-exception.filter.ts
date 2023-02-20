import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { Response } from 'express';
import { CustomError } from '../exceptions/custom-error';
import { CustomServerError } from '../exceptions/custom-server.exception';
import { logDebug, logError } from '../utils/logger.util';
import isEmpty from 'lodash/isEmpty';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    try {
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      if (isAxiosError(exception)) {
        const exceptionRes = exception.response;
        const statusText = exceptionRes?.statusText || exceptionRes;

        logError(
          request.url,
          `${exceptionRes?.config.url} ${
            exceptionRes?.status || exceptionRes
          } ${statusText}`
        );
        logDebug('Request body', JSON.stringify(request.body));
        response
          .status(status)
          .json(new CustomServerError({ message: 'server/internal' }));
      } else if (exception instanceof NotFoundException) {
        response
          .status(HttpStatus.NOT_FOUND)
          .json(new CustomServerError({ message: 'server/not-found' }));
      } else {
        logError(
          request.url,
          exception instanceof Error
            ? // Stringify this will result in "{}"
              (exception as any)
            : JSON.stringify(exception)
        );
        logDebug('Request body', JSON.stringify(request.body));
        response.status(status).json(
          new CustomServerError({
            message: 'server/internal',
            detailMessage: exception as any,
          })
        );
      }
    } catch (error) {
      logError(
        request.url + ' catch all exception',
        error instanceof Error
          ? // Stringify this will result in "{}"
            (error as any)
          : JSON.stringify(error)
      );
      logDebug('Request body', JSON.stringify(request.body));
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        new CustomServerError({
          message: 'server/internal',
          detailMessage: error as any,
        })
      );
    }
  }
}

@Catch(CustomError)
export class CustomErrorFilter implements ExceptionFilter {
  catch(exception: CustomError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.status;
    response.status(status).json(exception);
  }
}

export const isAxiosError = (err: any): err is AxiosError => {
  return err.isAxiosError;
};
