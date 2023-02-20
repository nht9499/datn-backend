import { formatDateToMonthId } from './date.util';

export const generateShortId = (length = 6) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const generatePassword = (length = 6) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/**
 * Input: "Một Hai Ba Bốn"
 *
 * Output: [mot, mot hai, mot hai ba, mot hai ba bon, bon, ba bon, hai ba bon]
 */
export const convertFullNameToKeywordList = (str: string): string[] => {
  const normalizedStr = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const result: string[] = [];

  const words = normalizedStr.split(' ');

  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length + 1; j++) {
      result.push(words.slice(i, j).join(' '));
    }
  }

  return result;
};

export const getUserMonthUid = (uid: string, monthDate: Date): string => {
  return uid + '---' + formatDateToMonthId(monthDate);
};
