import { Injectable } from '@nestjs/common';
import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_DEVICE_INFO } from '../../../constants/firestore.constant';
import {
  DeviceSchema,
  DevicesInfoSchema
} from '../../devices/schemas/device.schema';

@Injectable()
export class DevicesInfoRepository {
  private getDevicesInfoDocRef(userUid: string): DocumentReference {
    return getFirestore().collection(COLLECTION_DEVICE_INFO.name).doc(userUid);
  }

  async getDeviceInfo(userUid: string): Promise<DevicesInfoSchema | null> {
    const docSnapshot = await this.getDevicesInfoDocRef(userUid).get();

    return (docSnapshot.data() as DevicesInfoSchema | undefined) ?? null;
  }

  async addOrUpdateDeviceData(
    userUid: string,
    deviceSchema: DeviceSchema
  ): Promise<void> {
    const docRef = this.getDevicesInfoDocRef(userUid);

    await getFirestore().runTransaction(async (t) => {
      const docSnapshot = await t.get(docRef);

      const schema = docSnapshot.data() as DevicesInfoSchema | undefined;

      // * Create new schema

      if (schema == null) {
        const newSchema: DevicesInfoSchema = {
          id: userUid,
          deviceList: [deviceSchema]
        };

        t.set(docRef, newSchema);
        return;
      }

      // * Update existing schema

      const newDeviceList = [...schema.deviceList];

      const foundIndex = newDeviceList.findIndex(
        (device) => device.deviceId == deviceSchema.deviceId
      );

      // Add device to array if device doesn't exist in schema
      if (foundIndex === -1) {
        newDeviceList.push(deviceSchema);
      }
      // Update existing device
      else {
        newDeviceList[foundIndex] = deviceSchema;
      }

      const newSchema: DevicesInfoSchema = {
        ...schema,
        deviceList: newDeviceList
      };

      t.set(docRef, newSchema);
    });
  }

  async removeDeviceData(userUid: string, deviceId: string): Promise<void> {
    const docRef = this.getDevicesInfoDocRef(userUid);

    await getFirestore().runTransaction(async (t) => {
      const docSnapshot = await t.get(docRef);

      const schema = docSnapshot.data() as DevicesInfoSchema | undefined;

      if (schema == null) {
        return;
      }

      const newDeviceList = schema.deviceList.filter(
        (device) => device.deviceId !== deviceId
      );

      const newSchema = {
        ...schema,
        deviceList: newDeviceList
      };

      t.set(docRef, newSchema);
    });
  }
}
