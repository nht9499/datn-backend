import { Timestamp } from 'firebase-admin/firestore';
import {
  AppointmentStatus,
  MedicalFormType,
  GuidanceType,
  GuidanceUnit,
  UserState,
} from '../../../constants/enum.constant';
import { MeetingSchema } from './meeting.schema';

export interface AppointmentSchema {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: AppointmentStatus;
  patientUid: string;
  doctorUid: string;
  userRequest: UserRequest;
  feeInfo: FeeInfo | null;
  appointmentBookInfo: AppointmentBookInfo | null;
  medicalFormList?: MedicalFormSchema[];
  guidanceList?: GuidanceSchema[] | null;
  meeting?: MeetingSchema | null;
}

export interface UserRequest {
  createdAt: Timestamp;
  descriptionText: string | null;
  descriptionAudioUrl: string | null;
  questionText: string | null;
  questionAudioUrl: string | null;
  attachmentUrlList: string[];
}

export interface FeeInfo {
  createdAt: Timestamp;
  isFree: boolean;
  initialFee: number;
  recurringFee: number;
}

export interface AppointmentBookInfo {
  createdAt: Timestamp;
  finalFee: number;
  startAt: Timestamp;
  orgDurationInMinutes: number;
  // actualDurationInMinutes: number | null;
}

export interface BaseMedicalForm {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  type: MedicalFormType;
}

export interface MedicalHistoryForm {
  height: number;
  weight: number;
  medicalHistory: string[];
  subjectiveSigns: string[];
  allergy: string | null;
  physicalExercises: number;
  dietRisk: number;
  drinking: number;
  smoking: number;
  note: string | null;
  attachmentUrlList: string[];
}

export interface VitalSignsForm {
  height: number;
  weight: number;
  bodyTemperature: number;
  heartRate: number;
  respiration: number;
  spO2: number;
  bloodPressureLow: number;
  bloodPressureHight: number;
}

export interface TestResultsForm {
  attachmentUrlList: string[];
}

export interface CurrentPrescriptionForm {
  attachmentUrlList: string[];
}

export interface MedicalHistoryFormSchema extends BaseMedicalForm {
  type: 'medicalHistory';
  medicalHistoryForm: MedicalHistoryForm | null;
}

export interface VitalSignsFormSchema extends BaseMedicalForm {
  type: 'vitalSigns';
  vitalSignsForm: VitalSignsForm | null;
}

export interface TestResultsFormSchema extends BaseMedicalForm {
  type: 'testResults';
  testResultsForm: TestResultsForm | null;
}

export interface CurrentPrescriptionFormSchema extends BaseMedicalForm {
  type: 'currentPrescription';
  currentPrescriptionForm: CurrentPrescriptionForm | null;
}

export type MedicalFormSchema =
  | MedicalHistoryFormSchema
  | VitalSignsFormSchema
  | TestResultsFormSchema
  | CurrentPrescriptionFormSchema;

export interface BaseGuidance {
  id: string;
  createdAt: Timestamp;
  type: GuidanceType;
}

export interface NoteGuidanceSchema extends BaseGuidance {
  type: 'note';
  noteGuidance: NoteGuidance;
}
interface NoteGuidance {
  note: string;
}
export interface PrescriptionGuidanceSchema extends BaseGuidance {
  type: 'prescription';
  prescriptionGuidance: PrescriptionGuidance;
}
interface PrescriptionGuidance {
  medicineList: Medicine[];
  note: string | null;
}
interface Medicine {
  name: string;
  totalAmount: number;
  unit: GuidanceUnit;
  amountInUnitsPerTime: number;
  timesPerDay: number;
  medicineNote: string | null;
}

export type GuidanceSchema = PrescriptionGuidanceSchema | NoteGuidanceSchema;
