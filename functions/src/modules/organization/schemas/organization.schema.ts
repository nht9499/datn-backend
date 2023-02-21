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
interface UserListSchema {
  uid: string;
  email: string | null;
}

export interface OrganizationSchema {
  uid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: DoctorStatus;
  fullName: string;
  email?: string | null;
  searchableKeywordList: string[];
  memberList: UserListSchema[];
  adminUidList: string[];
  data: DataSchema[];
}
