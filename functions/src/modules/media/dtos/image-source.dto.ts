export class BaseImageSourceDto {
  type: ImageSourceType;
}

export class ImageSourceDoctorProfileDto extends BaseImageSourceDto {
  type: 'doctorProfile';
}

export class ImageSourceDoctorBusinessCardDto extends BaseImageSourceDto {
  type: 'doctorBusinessCard';
}

export const imageSourceTypeList = [
  'doctorProfile',
  'doctorBusinessCard',
] as const;
export type ImageSourceType = typeof imageSourceTypeList[number];

export const getImageDirPathAndFileName = (args: {
  uid: string;
  imagePurpose: ImageSourceDoctorProfileDto | ImageSourceDoctorBusinessCardDto;
}): {
  dirPath: string;
  fileName?: string;
} => {
  const { uid, imagePurpose } = args;

  const baseDirPath = `images/${uid}`;

  let dirPath: string;
  let fileName: string | undefined;

  switch (imagePurpose.type) {
    case 'doctorProfile':
      dirPath = `${baseDirPath}/doctorProfile`;
      break;
    case 'doctorBusinessCard':
      dirPath = `${baseDirPath}/businessCard`;
      fileName = 'businessCard';
      break;
  }

  return {
    dirPath: dirPath,
    fileName: fileName,
  };
};
