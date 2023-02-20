import { FirebaseError } from 'firebase-admin/app';
import { CustomError } from '../exceptions/custom-error';
import {
  CustomFirebaseError,
  FirebaseErrorMessage,
} from '../exceptions/custom-firebase.exception';
import { CustomServerError } from '../exceptions/custom-server.exception';
import { logError } from './logger.util';

export const isFirebaseError = (err: any): err is FirebaseError => {
  return err.code && err.message;
};

export const handleFirebaseError = (err: any): CustomError => {
  logError(
    'Firebase repo error',
    JSON.stringify(err, Object.getOwnPropertyNames(err))
  );

  if (!isFirebaseError(err)) {
    return new CustomServerError({});
  }
  return new CustomFirebaseError(err.code as FirebaseErrorMessage);
};
