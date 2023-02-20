import { Request } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { CustomFirebaseError } from '../exceptions/custom-firebase.exception';
import { handleFirebaseError } from './firebase-error.util';
import { logError } from './logger.util';

export const AUTH_ROLE_HEADER = 'x-auth-role';
export const DRIVER_ACCOUNT_TYPE = 'x-driver-account-type';

export const decodeFirebaseToken = async (token: string) => {
  try {
    return await getAuth().verifyIdToken(token);
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const getBearerStringFromRequest = (request: Request): string => {
  const bearerString = request.headers.authorization;

  if (!bearerString) {
    logError('Bearer', 'Missing bearer from request header');
    throw new CustomFirebaseError('auth/unauthorized');
  }

  return bearerString.split('Bearer ')[1];
};

export const decodeFirebaseTokenFromRequest = async (request: Request) => {
  return decodeFirebaseToken(getBearerStringFromRequest(request));
};
