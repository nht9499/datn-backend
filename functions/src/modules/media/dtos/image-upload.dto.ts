import { Type } from 'class-transformer';
import { IsBase64, IsNotEmpty, ValidateNested } from 'class-validator';
import {
  BaseImageSourceDto,
  ImageSourceDoctorBusinessCardDto,
  ImageSourceDoctorProfileDto,
} from './image-source.dto';

export class ImageUploadDto {
  @IsBase64()
  imageBase64: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => BaseImageSourceDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: ImageSourceDoctorProfileDto, name: 'doctorProfile' },
        { value: ImageSourceDoctorBusinessCardDto, name: 'doctorBusinessCard' },
      ],
    },
  })
  imageSource: ImageSourceDoctorProfileDto | ImageSourceDoctorBusinessCardDto;
}
