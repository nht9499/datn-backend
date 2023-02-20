import { Injectable } from '@nestjs/common';
import { DevicesInfoRepository } from '../shared/repositories/devices-info-repository';
import { UpdateDeviceDataDto } from './dtos/device-write.dto';
import { messaging } from 'firebase-admin';

@Injectable()
export class DeviceService {
  constructor(private readonly devicesInfoRepository: DevicesInfoRepository) {}

  async addOrUpdateDeviceData(
    userUid: string,
    dto: UpdateDeviceDataDto
  ): Promise<void> {
    await this.devicesInfoRepository.addOrUpdateDeviceData(userUid, {
      deviceId: dto.deviceId,
      platform: dto.platform,
      fcmToken: dto.fcmToken,
    });
  }

  async removeDeviceData(userUid: string, deviceId: string): Promise<void> {
    await this.devicesInfoRepository.removeDeviceData(userUid, deviceId);
  }

  async sendPushNotification(
    userUid: string,
    payload: {
      title: string;
      description: string;
    }
  ): Promise<void> {
    const { title, description } = payload;

    const androidFcmTokenList: string[] = [];
    const iosFcmTokenList: string[] = [];
    const deviceInfo = await this.devicesInfoRepository.getDeviceInfo(userUid);
    if (!deviceInfo) {
      return;
    }
    deviceInfo.deviceList.map((device) => {
      if (device.platform === 'android') {
        androidFcmTokenList.push(device.fcmToken);
      } else {
        iosFcmTokenList.push(device.fcmToken);
      }
    });

    const promiseList: Promise<any>[] = [];
    if (androidFcmTokenList.length > 0) {
      promiseList.push(
        messaging().sendToDevice(
          androidFcmTokenList,
          {
            notification: undefined,
            data: { dataJson: JSON.stringify(payload) },
          },
          { contentAvailable: true, priority: 'high' }
        )
      );
    }

    if (iosFcmTokenList.length > 0) {
      promiseList.push(
        messaging().sendToDevice(
          iosFcmTokenList,
          {
            notification: {
              title: title,
              body: description,
              // Workaround for iOS. On Android, we use local notification on client side to achieve this.
              sound: 'default',
            },
            data: { dataJson: JSON.stringify(payload) },
          },
          { contentAvailable: true, priority: 'high' }
        )
      );
    }

    await Promise.all(promiseList);
  }
}
