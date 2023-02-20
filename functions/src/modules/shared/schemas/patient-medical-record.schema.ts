import { Timestamp } from 'firebase-admin/firestore';
import {
  AppointmentRecordType,
  NoteType
} from '../../../constants/enum.constant';
import {
  GuidanceSchema,
  MedicalFormSchema
} from '../../appointment/schema/appointment.schema';

interface BasePatientMedicalRecordSchema {
  id: string;
  createdAt: Timestamp;
  patientId: string;
  doctorId: string;
  appointmentId: string | null;
  type: AppointmentRecordType;
}

export interface PatientRequestAppointmentRecordSchema
  extends BasePatientMedicalRecordSchema {
  type: 'patientRequestAppointment';
  patientRequestAppointmentRecord: PatientRequestAppointmentRecord;
}
interface PatientRequestAppointmentRecord {
  descriptionText: string | null;
  descriptionAudioUrl: string | null;
  questionText: string | null;
  questionAudioUrl: string | null;
  attachmentUrlList: string[];
}

export interface PatientConfirmAppointmentRecordSchema
  extends BasePatientMedicalRecordSchema {
  type: 'patientConfirmAppointment';
  patientConfirmAppointmentRecord: PatientConfirmAppointmentRecord;
}
interface PatientConfirmAppointmentRecord {
  finalFee: number;
  startAt: Timestamp;
  orgDurationInMinutes: number;
}

export interface AppointmentEndedRecordSchema
  extends BasePatientMedicalRecordSchema {
  type: 'appointmentEnded';
  appointmentEndedRecord: AppointmentEndedRecord;
}
interface AppointmentEndedRecord {
  actualDurationInMinutes: number;
}

export interface DoctorCreatePrivateNoteRecordSchema
  extends BasePatientMedicalRecordSchema {
  type: 'doctorCreatePrivateNote';
  doctorCreatePrivateNoteRecord: DoctorCreatePrivateNoteRecord;
}

export interface PatientProvideMedicalFormRecordSchema
  extends BasePatientMedicalRecordSchema {
  type: 'patientProvideMedicalForm';
  patientProvideMedicalForm: PatientProvideMedicalForm;
}
interface PatientProvideMedicalForm {
  medicalFormList: MedicalFormSchema[];
}

export interface DoctorGiveGuidanceRecordSchema
  extends BasePatientMedicalRecordSchema {
  type: 'doctorGiveGuidance';
  doctorGiveGuidanceRecord: GuidanceRecord;
}
interface GuidanceRecord {
  guidanceList: GuidanceSchema[];
}

export type PatientMedicalRecordSchema =
  | PatientRequestAppointmentRecordSchema
  | PatientConfirmAppointmentRecordSchema
  | AppointmentEndedRecordSchema
  | DoctorCreatePrivateNoteRecordSchema
  | PatientProvideMedicalFormRecordSchema
  | DoctorGiveGuidanceRecordSchema;

interface BaseNoteSchema {
  id: string;
  type: NoteType;
}
export interface BacsicNoteSchema extends BaseNoteSchema {
  type: 'basicNote';
  basicNote: BasiscNote;
}
interface BasiscNote {
  noteDescription: string;
}
export interface DoctorCreatePrivateNoteRecord {
  privateNoteList: PrivateNote[];
}
export type PrivateNote = BacsicNoteSchema;
