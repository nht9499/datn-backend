import { Injectable } from '@nestjs/common';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  AppointmentRecordType,
  AuthRole,
} from '../../../constants/enum.constant';
import { COLLECTION_PATIENT_DOCTOR_CONNECTIONS } from '../../../constants/firestore.constant';
import { CustomServerError } from '../../../exceptions/custom-server.exception';
import { generateRandomId } from '../../../utils/random.util';
import {
  GuidanceSchema,
  MedicalFormSchema,
} from '../../appointment/schema/appointment.schema';
import { PrivateNoteSchema } from '../../patient/schemas/private-note.schema';
import {
  DoctorSnapshotSchema,
  getSortOrderForDoctorFromAppointmentStatus,
  getSortOrderForPatientFromAppointmentStatus,
  PatientDoctorConnectionSchema,
  PatientSnapshotSchema,
  RecentAppointmentSnapshot,
} from '../schemas/patient-doctor-connection.schema';
import {
  BacsicNoteSchema,
  DoctorCreatePrivateNoteRecordSchema,
  DoctorGiveGuidanceRecordSchema,
  PatientMedicalRecordSchema,
  PatientProvideMedicalFormRecordSchema,
} from '../schemas/patient-medical-record.schema';

@Injectable()
export class PatientDoctorConnectionRepository {
  async createConnection(schema: PatientDoctorConnectionSchema): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(schema.id)
      .create(schema);
  }

  async getConnectionByPatientAndDoctor(args: {
    patientUid: string;
    doctorUid: string;
  }): Promise<PatientDoctorConnectionSchema | null> {
    const { patientUid, doctorUid } = args;

    const patientUidField: keyof PatientDoctorConnectionSchema = 'patientUid';
    const doctorUidField: keyof PatientDoctorConnectionSchema = 'doctorUid';

    const querySnapshot = await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .where(patientUidField, '==', patientUid)
      .where(doctorUidField, '==', doctorUid)
      .get();

    if (querySnapshot.docs.length <= 0) {
      return null;
    }

    return querySnapshot.docs[0].data() as PatientDoctorConnectionSchema;
  }

  async getConnectionById(
    connectionId: string
  ): Promise<PatientDoctorConnectionSchema | null> {
    const docSnapshot = await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .get();

    return (
      (docSnapshot.data() as PatientDoctorConnectionSchema | undefined) ?? null
    );
  }

  async updateConnectionRecentAppointment(
    connectionId: string,
    recentAppointment: RecentAppointmentSnapshot,
    updatedBy: AuthRole | null
  ): Promise<void> {
    const recentAppointmentSnapshotField: keyof PatientDoctorConnectionSchema =
      'recentAppointmentSnapshot';
    const sortOrderForDoctorField: keyof PatientDoctorConnectionSchema =
      'sortOrderForDoctor';
    const sortOrderForPatientField: keyof PatientDoctorConnectionSchema =
      'sortOrderForPatient';
    const lastReadAtDoctor: keyof PatientDoctorConnectionSchema =
      'lastReadAtDoctor';
    const lastReadAtPatient: keyof PatientDoctorConnectionSchema =
      'lastReadAtPatient';

    const sortOrderForDoctor = getSortOrderForDoctorFromAppointmentStatus(
      recentAppointment.status
    );
    const sortOrderForPatient = getSortOrderForPatientFromAppointmentStatus(
      recentAppointment.status
    );

    await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .update({
        [recentAppointmentSnapshotField]: recentAppointment,
        [sortOrderForDoctorField]: sortOrderForDoctor,
        [sortOrderForPatientField]: sortOrderForPatient,
        ...(updatedBy === 'doctor' && { [lastReadAtPatient]: null }),
        ...(updatedBy === 'patient' && { [lastReadAtDoctor]: null }),
      });
  }

  async updatePatientSnapshotForAllPatientConnections(
    patientUid: string,
    patientSnapshot: PatientSnapshotSchema
  ): Promise<void> {
    const patientUidField: keyof PatientDoctorConnectionSchema = 'patientUid';

    const querySnapshot = await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .where(patientUidField, '==', patientUid)
      .get();

    const patientSnapshotField: keyof PatientDoctorConnectionSchema =
      'patientSnapshot';

    await Promise.all(
      querySnapshot.docs.map((doc) =>
        doc.ref.update({
          [patientSnapshotField]: patientSnapshot,
        })
      )
    );
  }

  async updateDoctorSnapshotForAllDoctorConnections(
    doctorUid: string,
    doctorSnapshot: DoctorSnapshotSchema
  ): Promise<void> {
    const doctorUidField: keyof PatientDoctorConnectionSchema = 'doctorUid';

    const querySnapshot = await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .where(doctorUidField, '==', doctorUid)
      .get();

    const doctorSnapshotField: keyof PatientDoctorConnectionSchema =
      'doctorSnapshot';

    await Promise.all(
      querySnapshot.docs.map((doc) =>
        doc.ref.update({
          [doctorSnapshotField]: doctorSnapshot,
        })
      )
    );
  }

  async createPatientMedicalRecord(
    connectionId: string,
    schema: PatientMedicalRecordSchema
  ): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .collection(
        COLLECTION_PATIENT_DOCTOR_CONNECTIONS.subColPatientMedicalRecords
      )
      .doc(schema.id)
      .set(schema);
  }

  // async createOrUpdatePrivateNoteRecord(
  //   args: {
  //     patientId: string;
  //     doctorId: string;
  //     connectionId: string;
  //     appointmentId: string;
  //   },
  //   noteDescription: string
  // ): Promise<void> {
  //   const { connectionId, patientId, doctorId, appointmentId } = args;
  //   const type: AppointmentRecordType = 'doctorCreatePrivateNote';
  //   const colRef = getFirestore()
  //     .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
  //     .doc(connectionId)
  //     .collection(
  //       COLLECTION_PATIENT_DOCTOR_CONNECTIONS.subColPatientMedicalRecords
  //     );
  //   const privateNoteSchema: BacsicNoteSchema = {
  //     id: generateRandomId(),
  //     type: 'basicNote',
  //     basicNote: {
  //       noteDescription
  //     }
  //   };
  //   await getFirestore().runTransaction(async (t) => {
  //     const querySnapshot = await t.get(
  //       colRef
  //         .where('type', '==', type)
  //         .where('appointmentId', '==', appointmentId)
  //     );
  //     const patientMedicalRecord =
  //       querySnapshot.docs[0]?.data() as DoctorCreatePrivateNoteRecordSchema;
  //     if (!patientMedicalRecord) {
  //       const privateNoteRecord: DoctorCreatePrivateNoteRecordSchema = {
  //         id: generateRandomId(),
  //         createdAt: Timestamp.now(),
  //         patientId,
  //         doctorId,
  //         appointmentId,
  //         type,
  //         doctorCreatePrivateNoteRecord: {
  //           privateNoteList: [privateNoteSchema]
  //         }
  //       };
  //       t.set(colRef.doc(privateNoteRecord.id), privateNoteRecord);
  //     } else {
  //       patientMedicalRecord.doctorCreatePrivateNoteRecord.privateNoteList.push(
  //         privateNoteSchema
  //       );
  //       t.update(colRef.doc(patientMedicalRecord.id), patientMedicalRecord);
  //     }
  //   });
  // }

  async createOrUpdateMedicalFormRecord(
    args: {
      patientId: string;
      doctorId: string;
      connectionId: string;
      appointmentId: string;
    },
    schema: MedicalFormSchema
  ): Promise<void> {
    const { connectionId, patientId, doctorId, appointmentId } = args;
    const type: AppointmentRecordType = 'patientProvideMedicalForm';
    const colRef = getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .collection(
        COLLECTION_PATIENT_DOCTOR_CONNECTIONS.subColPatientMedicalRecords
      );
    await getFirestore().runTransaction(async (t) => {
      const querySnapshot = await t.get(
        colRef
          .where('type', '==', type)
          .where('appointmentId', '==', appointmentId)
      );
      const patientMedicalRecord =
        querySnapshot.docs[0]?.data() as PatientProvideMedicalFormRecordSchema;
      if (!patientMedicalRecord) {
        const privateNoteRecord: PatientProvideMedicalFormRecordSchema = {
          id: generateRandomId(),
          createdAt: Timestamp.now(),
          patientId,
          doctorId,
          appointmentId,
          type,
          patientProvideMedicalForm: {
            medicalFormList: [schema],
          },
        };
        t.set(colRef.doc(privateNoteRecord.id), privateNoteRecord);
      } else {
        const foundIndex =
          patientMedicalRecord.patientProvideMedicalForm.medicalFormList.findIndex(
            (medicalForm) => medicalForm.id == schema.id
          );
        if (foundIndex === -1) {
          patientMedicalRecord.patientProvideMedicalForm.medicalFormList.push(
            schema
          );
        } else {
          // keep createdAt time
          schema.createdAt =
            patientMedicalRecord.patientProvideMedicalForm.medicalFormList[
              foundIndex
            ].createdAt;
          patientMedicalRecord.patientProvideMedicalForm.medicalFormList[
            foundIndex
          ] = schema;
        }
        t.update(colRef.doc(patientMedicalRecord.id), patientMedicalRecord);
      }
    });
  }

  async createOrUpdateGuidanceRecord(
    args: {
      patientId: string;
      doctorId: string;
      connectionId: string;
      appointmentId: string;
    },
    schema: GuidanceSchema
  ): Promise<void> {
    const { connectionId, patientId, doctorId, appointmentId } = args;
    const type: AppointmentRecordType = 'doctorGiveGuidance';
    const colRef = getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .collection(
        COLLECTION_PATIENT_DOCTOR_CONNECTIONS.subColPatientMedicalRecords
      );
    await getFirestore().runTransaction(async (t) => {
      const querySnapshot = await t.get(
        colRef
          .where('type', '==', type)
          .where('appointmentId', '==', appointmentId)
      );
      const patientMedicalRecord =
        querySnapshot.docs[0]?.data() as DoctorGiveGuidanceRecordSchema;
      if (!patientMedicalRecord) {
        const privateNoteRecord: DoctorGiveGuidanceRecordSchema = {
          id: generateRandomId(),
          createdAt: Timestamp.now(),
          patientId,
          doctorId,
          appointmentId,
          type,
          doctorGiveGuidanceRecord: {
            guidanceList: [schema],
          },
        };
        t.set(colRef.doc(privateNoteRecord.id), privateNoteRecord);
      } else {
        patientMedicalRecord.doctorGiveGuidanceRecord.guidanceList.push(schema);
        t.update(colRef.doc(patientMedicalRecord.id), patientMedicalRecord);
      }
    });
  }

  async markAsReadRecentAppointment(
    connectionId: string,
    updatedBy: AuthRole
  ): Promise<void> {
    const lastReadAtDoctor: keyof PatientDoctorConnectionSchema =
      'lastReadAtDoctor';
    const lastReadAtPatient: keyof PatientDoctorConnectionSchema =
      'lastReadAtPatient';

    await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .update({
        ...(updatedBy === 'doctor' && { [lastReadAtDoctor]: Timestamp.now() }),
        ...(updatedBy === 'patient' && {
          [lastReadAtPatient]: Timestamp.now(),
        }),
      });
  }

  async createPrivateNote(args: {
    connectionId: string;
    doctorUid: string;
    note: string;
  }) {
    const { connectionId, doctorUid, note } = args;
    const now = Timestamp.now();
    const schema: PrivateNoteSchema = {
      id: generateRandomId(),
      createdAt: now,
      updatedAt: now,
      doctorUid,
      note,
    };

    await getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.subColPrivateNotes)
      .doc(schema.id)
      .create(schema);
  }

  async updatePrivateNote(args: {
    connectionId: string;
    privateNoteId: string;
    note: string;
  }) {
    const { connectionId, privateNoteId, note } = args;
    const docRef = getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.subColPrivateNotes)
      .doc(privateNoteId);
    const snapshot = await docRef.get();
    const schema = snapshot.data() as PrivateNoteSchema;
    if (!schema)
      throw new CustomServerError({
        message: 'patient/not-found-note',
      });
    const now = Timestamp.now();
    const updatedAtField: keyof PrivateNoteSchema = 'updatedAt';
    const noteField: keyof PrivateNoteSchema = 'note';
    await docRef.update({
      [updatedAtField]: now,
      [noteField]: note,
    });
  }

  async deletePrivateNote(args: {
    connectionId: string;
    privateNoteId: string;
  }) {
    const { connectionId, privateNoteId } = args;
    const docRef = getFirestore()
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.name)
      .doc(connectionId)
      .collection(COLLECTION_PATIENT_DOCTOR_CONNECTIONS.subColPrivateNotes)
      .doc(privateNoteId);
    const snapshot = await docRef.get();
    const schema = snapshot.data() as PrivateNoteSchema;
    if (!schema)
      throw new CustomServerError({
        message: 'patient/not-found-note',
      });
    await docRef.delete();
  }
}
