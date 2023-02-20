import { IsIn, IsString } from 'class-validator';
import {
  DevicePlatform,
  devicePlatformList
} from '../../../constants/enum.constant';

export class UpdateDeviceDataDto {
  @IsString()
  deviceId: string;

  @IsIn(devicePlatformList)
  platform: DevicePlatform;

  @IsString()
  fcmToken: string;
}
