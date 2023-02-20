import { Timestamp } from 'firebase-admin/firestore';
import { Gender, PatientStatus } from '../../../constants/enum.constant';

interface DataSchema {
  uid: string;
  name: string;
  url: string;
  size: number;
  status: PatientStatus;
  sharedToSystem: boolean;
}

interface OrganizationSnapshotSchema {
  uid: string;
  name: string;
  isAdmin: boolean;
}

export interface UserSchema {
  uid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: PatientStatus;
  avatarImageUrl?: string | null;
  fullName?: string | null;
  dob?: Timestamp | null;
  gender?: Gender | null;
  email?: string | null;
  searchableKeywordList: string[];
  data: DataSchema[];
  organizationList: OrganizationSnapshotSchema[];
}
