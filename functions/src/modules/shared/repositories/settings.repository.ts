import { Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import {
  COLLECTION_SETTINGS,
  COLLECTION_VERSION_SETTINGS,
} from '../../../constants/firestore.constant';
import { CustomServerError } from '../../../exceptions/custom-server.exception';
import { logError } from '../../../utils/logger.util';
import { SettingsSchema } from '../../settings/schemas/settings.schema';
import { VersionSettingsSchema } from '../../settings/schemas/version-settings.schema';

@Injectable()
export class SettingsRepository {
  async setSettings(schema: SettingsSchema): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_SETTINGS.name)
      .doc(COLLECTION_SETTINGS.docId)
      .set(schema);
  }

  async getSettings(): Promise<SettingsSchema> {
    const docSnapshot = await getFirestore()
      .collection(COLLECTION_SETTINGS.name)
      .doc(COLLECTION_SETTINGS.docId)
      .get();

    const schema = docSnapshot.data() as SettingsSchema | undefined;
    if (!schema) {
      logError('Settings', 'Settings not found');
      throw new CustomServerError({ message: 'server/internal' });
    }

    return schema;
  }

  async setVersionSettings(schema: VersionSettingsSchema): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_VERSION_SETTINGS.name)
      .doc(COLLECTION_VERSION_SETTINGS.docId)
      .set(schema);
  }
}
