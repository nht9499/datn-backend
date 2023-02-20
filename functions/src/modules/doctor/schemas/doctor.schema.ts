import { Timestamp } from 'firebase-admin/firestore';
import { Gender, DoctorStatus } from '../../../constants/enum.constant';

export interface DoctorSchema {
  uid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: DoctorStatus;
  avatarImageUrl: string;
  email: string;
  fullName: string;
  dob: Timestamp;
  gender: Gender;
  phoneNumber: string;
  academicDegree: string;
  specialty: string;
  workExperienceList: WorkExperienceSchema[];
  searchableKeywordList: string[];
  sharingToPatientUidList: string[];
  maxTimeToBookInDay: string;
}

export interface WorkExperienceSchema {
  workplace: string;
  title: string;
}
