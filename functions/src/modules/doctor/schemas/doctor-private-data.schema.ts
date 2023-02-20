import { TransactionStatus } from '../../../constants/enum.constant';
import { Timestamp } from 'firebase-admin/firestore';

export interface DoctorPrivateDataSchema {
  personalIdCardImageUrlList: string[];
  practisingCertificateImageUrlList: string[];
  otherCertificateImageUrlList: string[];
  costPerMau: number | null;
  lastWithdrawalSnapshot: WithdrawalSnapshot | null;
}

export interface WithdrawalSnapshot {
  status: TransactionStatus;
  createdAt: Timestamp;
}
