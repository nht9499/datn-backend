import { DevicePlatform } from '../../../constants/enum.constant';

export interface DevicesInfoSchema {
  id: string;
  deviceList: DeviceSchema[];
}

export interface DeviceSchema {
  deviceId: string;
  platform: DevicePlatform;
  fcmToken: string;
}
