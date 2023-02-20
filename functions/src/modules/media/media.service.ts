import { Injectable } from '@nestjs/common';
import { uploadImageToStorage } from '../../utils/storage.util';
import { getImageDirPathAndFileName } from './dtos/image-source.dto';
import { ImageUploadDto } from './dtos/image-upload.dto';

@Injectable()
export class MediaService {
  async uploadImage(byUid: string, dto: ImageUploadDto): Promise<string> {
    const { dirPath, fileName } = getImageDirPathAndFileName({
      uid: byUid,
      imagePurpose: dto.imageSource,
    });

    return await uploadImageToStorage({
      imageBase64: dto.imageBase64,
      dirPath,
      fileName,
    });
  }
}
