import { Timestamp } from 'firebase-admin/firestore';
import {
  AppointmentStatus,
  DoctorStatus,
  Gender,
  PatientStatus,
} from '../../../constants/enum.constant';
import { isoStringFromTimestamp } from '../../../utils/date.util';
import { convertFullNameToKeywordList } from '../../../utils/string.util';
import { DoctorUpdateDto, DoctorWriteDto } from '../../doctor/dtos';
import { WorkExperienceDto } from '../../doctor/dtos/doctor.dto';
import {
  DoctorSchema,
  WorkExperienceSchema,
} from '../../doctor/schemas/doctor.schema';
import { PatientWriteDto } from '../../patient/dtos/patient-write.dto';
import { PatientSchema } from '../../patient/schemas/patient.schema';

export interface PatientDoctorConnectionSchema {
  id: string;
  createdAt: Timestamp;
  patientUid: string;
  doctorUid: string;
  recentAppointmentSnapshot: RecentAppointmentSnapshot | null;
  sortOrderForPatient: number;
  sortOrderForDoctor: number;
  lastReadAtPatient: Timestamp | null;
  lastReadAtDoctor: Timestamp | null;

  patientSnapshot: PatientSnapshotSchema;
  doctorSnapshot: DoctorSnapshotSchema;
}

export interface RecentAppointmentSnapshot {
  appointmentId: string;
  updatedAt: Timestamp;
  status: AppointmentStatus;
  userRequest: RecentAppointmentUserRequestSnapshot;
  bookInfo: RecentAppointmentBookInfoSnapshot | null;
}

export interface RecentAppointmentUserRequestSnapshot {
  // Either text or audio must have value
  descriptionText: string | null;
  descriptionAudioUrl: string | null;

  // Either text or audio must have value
  questionText: string | null;
  questionAudioUrl: string | null;

  attachmentUrlList: string[];
}

export interface RecentAppointmentBookInfoSnapshot {
  startAt: Timestamp;
  orgDurationInMinutes: number;
}

export const getSortOrderForPatientFromAppointmentStatus = (
  appointmentStatus: AppointmentStatus
): number => {
  switch (appointmentStatus) {
    case 'duringMeeting':
      return 0;
    case 'patientConfirming':
      return 1;
    case 'doctorConcluding':
      return 2;
    case 'beforeMeeting':
      return 3;
    case 'doctorReviewing':
      return 4;
    case 'doctorCanceled':
      return 5;
    case 'patientCanceled':
      return 6;
    case 'done':
      return 7;
  }
};

export const getSortOrderForDoctorFromAppointmentStatus = (
  appointmentStatus: AppointmentStatus
): number => {
  switch (appointmentStatus) {
    case 'duringMeeting':
      return 0;
    case 'doctorReviewing':
      return 1;
    case 'doctorConcluding':
      return 2;
    case 'beforeMeeting':
      return 3;
    case 'patientConfirming':
      return 4;
    case 'patientCanceled':
      return 5;
    case 'doctorCanceled':
      return 6;
    case 'done':
      return 7;
  }
};

export interface PatientSnapshotSchema {
  uid: string;
  status: PatientStatus;
  avatarImageUrl: string;
  fullName: string;
  dob: Timestamp;
  gender: Gender;
  searchableKeywordList: string[];
}

export const parsePatientSnapshot = (args: {
  uid: string;
  status: PatientStatus;
  avatarImageUrl: string;
  fullName: string;
  dob: Timestamp;
  gender: Gender;
}): PatientSnapshotSchema => {
  return {
    uid: args.uid,
    status: args.status,
    avatarImageUrl: args.avatarImageUrl,
    fullName: args.fullName,
    dob: args.dob,
    gender: args.gender,
    searchableKeywordList: convertFullNameToKeywordList(args.fullName),
  };
};

export const checkPatientSnapshotNeedChange = (
  writeDto: PatientWriteDto,
  oldPatientSchema: PatientSchema
): boolean => {
  return (
    oldPatientSchema.avatarImageUrl !== writeDto.avatarImageUrl ||
    isoStringFromTimestamp(oldPatientSchema.dob) !== writeDto.dob ||
    oldPatientSchema.fullName !== writeDto.fullName ||
    oldPatientSchema.gender !== writeDto.gender
  );
};

export interface DoctorSnapshotSchema {
  uid: string;
  status: DoctorStatus;
  avatarImageUrl: string;
  fullName: string;
  dob: Timestamp;
  gender: Gender;
  academicDegree: string;
  specialty: string;
  workExperienceList: WorkExperienceSchema[];
  searchableKeywordList: string[];
  maxTimeToBookInDay: string;
}

export const parseDoctorSnapshot = (args: {
  uid: string;
  status: DoctorStatus;
  avatarImageUrl: string;
  fullName: string;
  dob: Timestamp;
  gender: Gender;
  academicDegree: string;
  specialty: string;
  workExperienceList: WorkExperienceSchema[];
  maxTimeToBookInDay: string;
}): DoctorSnapshotSchema => {
  return {
    uid: args.uid,
    status: args.status,
    avatarImageUrl: args.avatarImageUrl,
    fullName: args.fullName,
    dob: args.dob,
    gender: args.gender,
    academicDegree: args.academicDegree,
    specialty: args.specialty,
    workExperienceList: args.workExperienceList,
    searchableKeywordList: convertFullNameToKeywordList(args.fullName),
    maxTimeToBookInDay: args.maxTimeToBookInDay,
  };
};

export const checkDoctorSnapshotNeedChange = (
  writeDto: DoctorUpdateDto,
  oldDoctorSchema: DoctorSchema
): boolean => {
  return (
    writeDto.avatarImageUrl !== oldDoctorSchema.avatarImageUrl ||
    writeDto.fullName !== oldDoctorSchema.fullName ||
    writeDto.dob !== isoStringFromTimestamp(oldDoctorSchema.dob) ||
    writeDto.gender !== oldDoctorSchema.gender ||
    writeDto.academicDegree !== oldDoctorSchema.academicDegree ||
    writeDto.specialty !== oldDoctorSchema.academicDegree ||
    !isEqualWorkExperienceList(
      writeDto.workExperienceList,
      oldDoctorSchema.workExperienceList
    )
  );
};

const isEqualWorkExperienceList = (
  workExperienceList1: WorkExperienceDto[],
  workExperienceList2: WorkExperienceSchema[]
): boolean => {
  if (workExperienceList1.length !== workExperienceList2.length) {
    return false;
  }

  for (let i = 0; i < workExperienceList1.length; i++) {
    const workExperience1 = workExperienceList1[i];
    const workExperience2 = workExperienceList2[i];

    if (
      workExperience1.title !== workExperience2.title ||
      workExperience1.workplace !== workExperience2.workplace
    ) {
      return false;
    }
  }

  return true;
};
