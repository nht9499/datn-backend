import { HttpStatus } from '@nestjs/common';
import { CustomError } from './custom-error';

export const customErrorMessage = {
  'server/internal': {
    detailMessage: 'Internal server error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  'server/not-yet-implement': {
    detailMessage: 'Function is not yet implemented',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  'server/validation-failed': {
    detailMessage: 'Fail to validate request',
    status: HttpStatus.BAD_REQUEST,
  },
  'server/not-found': {
    detailMessage: 'Endpoint not found',
    status: HttpStatus.NOT_FOUND,
  },
  'auth/unauthorized': {
    detailMessage: 'Unauthorized request',
    status: HttpStatus.UNAUTHORIZED,
  },
  'auth/missing-header-auth-role': {
    detailMessage: 'Missing header for auth role',
    status: HttpStatus.BAD_REQUEST,
  },
  // Patient
  'patient/not-found': {
    detailMessage: 'Patient not found',
    status: HttpStatus.NOT_FOUND,
  },
  'patient/doctor-already-connected': {
    detailMessage: 'Doctor already connected',
    status: HttpStatus.BAD_REQUEST,
  },
  'patient/not-found-note': {
    detailMessage: 'Note not found',
    status: HttpStatus.NOT_FOUND,
  },
  // Doctor
  'doctor/already-exists': {
    detailMessage: 'Doctor already exists',
    status: HttpStatus.BAD_REQUEST,
  },
  'doctor/not-found': {
    detailMessage: 'Doctor not found',
    status: HttpStatus.NOT_FOUND,
  },
  'doctor/not-found-bank-account': {
    detailMessage: 'Bank account not found',
    status: HttpStatus.BAD_REQUEST,
  },
  'doctor/not-found-transaction': {
    detailMessage: 'Transaction not found',
    status: HttpStatus.BAD_REQUEST,
  },
  'doctor/not-found-balance-info': {
    detailMessage: 'Balance info not found',
    status: HttpStatus.BAD_REQUEST,
  },
  'doctor/not-found-schedule': {
    detailMessage: 'Work schedule not found',
    status: HttpStatus.BAD_REQUEST,
  },
  'doctor/past-date': {
    detailMessage: 'Date must be in future',
    status: HttpStatus.BAD_REQUEST,
  },
  // Connection
  'connection/not-found': {
    detailMessage: 'Connection not found',
    status: HttpStatus.NOT_FOUND,
  },
  // Appointment
  'appointment/not-found': {
    detailMessage: 'Appointment not found',
    status: HttpStatus.BAD_REQUEST,
  },
  'appointment/description-null': {
    detailMessage: 'Either text or audio of description should be non-null',
    status: HttpStatus.BAD_REQUEST,
  },
  'appointment/question-null': {
    detailMessage: 'Either text or audio of question should be non-null',
    status: HttpStatus.BAD_REQUEST,
  },
  'appointment/not-found-form': {
    detailMessage: 'Medical form not found',
    status: HttpStatus.BAD_REQUEST,
  },
} as const;

export type CustomServerErrorMessage = keyof typeof customErrorMessage;
export type CustomServerErrorDetail =
  typeof customErrorMessage[CustomServerErrorMessage];

export class CustomServerError extends CustomError {
  message: CustomServerErrorMessage;

  constructor({
    message = 'server/internal',
    status,
    detailMessage,
  }: {
    status?: HttpStatus;
    message?: CustomServerErrorMessage;
    detailMessage?:
      | Record<string, unknown>
      | Record<string, unknown>[]
      | string;
  }) {
    super(
      status || customErrorMessage[message].status,
      message,
      detailMessage || customErrorMessage[message].detailMessage
    );
  }
}
