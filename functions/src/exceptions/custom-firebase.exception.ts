import { HttpStatus } from '@nestjs/common';
import { CustomError } from './custom-error';

// TODO: Handle more here
export const firebaseErrorMessage = {
  'auth/unauthorized': {
    detailMessage: 'Unauthorized request',
    status: HttpStatus.UNAUTHORIZED,
  },
  'auth/invalid-uid': {
    detailMessage: 'Invalid Uid',
    status: HttpStatus.UNAUTHORIZED,
  },
  'auth/id-token-expired': {
    detailMessage: 'Token Expired',
    status: HttpStatus.UNAUTHORIZED,
  },
  'auth/no-phone-number': {
    detailMessage: 'User does not have any phone number',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  'auth/no-email': {
    detailMessage: 'User does not have any email',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  'auth/email-already-exists': {
    detailMessage: 'Email already used',
    status: HttpStatus.BAD_REQUEST,
  },
  'firestore/doc-not-found': {
    detailMessage: 'Document not found',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  'firestore/doc-already-exists': {
    detailMessage: 'Document already exists',
    status: HttpStatus.CONFLICT,
  },
  'firestore/unbalance-firestore-param': {
    detailMessage:
      "Collection name list doesn't have the same arg as doc id list",
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  'firestore/missing-collection-name': {
    detailMessage: 'Missing collection name',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  'firestore/missing-firestore-path-parameter': {
    detailMessage: 'Mssing Firestore path to doc',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
} as const;

export type FirebaseErrorMessage = keyof typeof firebaseErrorMessage;
export type FirebaseErrorDetail =
  typeof firebaseErrorMessage[FirebaseErrorMessage];

export class CustomFirebaseError extends CustomError {
  message: FirebaseErrorMessage;

  constructor(message: FirebaseErrorMessage) {
    const { detailMessage, status } = firebaseErrorMessage[message] || {};
    super(status, message, detailMessage);
  }

  static isCustomFirebaseError(error: any): error is CustomFirebaseError {
    return firebaseErrorMessage[error.message as FirebaseErrorMessage] != null;
  }
}
