import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

export const generateRandomId = (): string => {
  return uuidv4();
};

export const generateNanoid = (): string => {
  return nanoid();
};
