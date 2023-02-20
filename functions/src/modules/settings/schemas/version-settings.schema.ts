import { COLLECTION_VERSION_SETTINGS } from '../../../constants/firestore.constant';

export type VersionString = `${number}.${number}.${number}`;

/** This schema shouldn't be changed because it will likely make old-version apps crash */
export interface VersionSettingsSchema {
  id: typeof COLLECTION_VERSION_SETTINGS.docId;

  // Pump those values up if other schemas has breaking changes

  minAppVersionDriverAndroid: VersionString;
  minAppVersionDriverIos: VersionString;
  minAppVersionUserAndroid: VersionString;
  minAppVersionUserIos: VersionString;
}
