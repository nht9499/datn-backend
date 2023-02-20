import { COLLECTION_SETTINGS } from '../../../constants/firestore.constant';

export interface SettingsSchema {
  id: typeof COLLECTION_SETTINGS.docId;

  doctorCostPerMau: number;
  doctorMinBalance: number;
  doctorMaxMonthlyWithdrawal: number;
}
