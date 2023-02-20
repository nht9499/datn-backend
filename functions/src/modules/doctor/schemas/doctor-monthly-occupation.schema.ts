import { Timestamp } from 'firebase-admin/firestore';
import { Gender, PatientStatus } from '../../../constants/enum.constant';

export interface MonthlyOccupationSchema {
  id: string;
  doctorUid: string;
  monthId: string;
  sharingToPatientUidList: string[];
  occupiedSlotList: OccupiedSlot[];
}

export interface OccupiedSlot {
  id: string;
  timeZone: string;
  dateOnly: string;
  timeRange: TimeRange;
  appointmentSnapshot: AppointmentSnapshot;
  patientSnapshot: PatientSnapshot;
}

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface AppointmentSnapshot {
  id: string;
  finalFee: number;
  startAt: Timestamp;
  orgDurationInMinutes: number;
}

interface PatientSnapshot {
  uid: string;
  status: PatientStatus;
  avatarImageUrl: string | null;
  fullName: string;
  dob: Timestamp;
  gender: Gender;
  searchableKeywordList: string[];
}
