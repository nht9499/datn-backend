import { HttpStatus } from '@nestjs/common';

export class CustomError {
  status: HttpStatus;
  message: string;
  detailMessage: Record<string, unknown> | Record<string, unknown>[] | string;

  constructor(
    status: HttpStatus,
    message: string,
    detailMessage: Record<string, unknown> | Record<string, unknown>[] | string
  ) {
    this.status = status;
    this.message = message;
    this.detailMessage = detailMessage;
  }
}
