import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

export const uploadImageToStorage = async ({
  dirPath,
  fileName = uuidv4(),
  imageBase64
}: {
  dirPath: string;
  fileName?: string;
  imageBase64: string;
}): Promise<string> => {
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const imageExtension = getImageExtension(imageBase64);

  const file = getStorage()
    .bucket()
    .file(`${dirPath}/${fileName}.${imageExtension}`);

  await file.save(imageBuffer);

  return file.publicUrl();
};

export const getImageExtension = (base64Data: string) => {
  const code = base64Data.charAt(0);
  if (code === '/') return 'jpg';
  if (code === 'i') return 'png';
  if (code === 'R') return 'gif';
  if (code === 'U') return 'webp';

  return 'png';
};

export const uploadAudioToStorage = async (args: {
  appointmentId: string;
  audioBase64: string;
}): Promise<string> => {
  const { appointmentId, audioBase64 } = args;

  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const file = getStorage()
    .bucket()
    .file(`appointments/${appointmentId}/audios/${uuidv4()}.wav`);

  await file.save(audioBuffer);

  return file.publicUrl();
};
