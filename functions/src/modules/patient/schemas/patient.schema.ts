import { Timestamp } from 'firebase-admin/firestore';
import { Gender, PatientStatus } from '../../../constants/enum.constant';

export interface PatientSchema {
  uid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: PatientStatus;
  avatarImageUrl: string;
  phoneNumber: string;
  fullName: string;
  dob: Timestamp;
  gender: Gender;
  email: string | null;
  searchableKeywordList: string[];
  sharingToDoctorUidList: string[];
}
