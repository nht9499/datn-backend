import { Timestamp } from 'firebase-admin/firestore';
import { DoctorStatus } from '../../../constants/enum.constant';

interface DataSchema {
  uid: string;
  name: string;
  url: string;
  size: number;
  status: DoctorStatus;
  sharedToSystem: boolean;
}

export interface OrganizationSchema {
  uid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: DoctorStatus;
  fullName: string;
  email?: string | null;
  searchableKeywordList: string[];
  memberUidList: string[];
  adminUidList: string[];
  data: DataSchema[];
}
