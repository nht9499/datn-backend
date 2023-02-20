import { Injectable } from '@nestjs/common';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_PATIENTS } from '../../../constants/firestore.constant';
import { PatientSchema } from '../../patient/schemas/patient.schema';

@Injectable()
export class PatientRepository {
  async createPatient(schema: PatientSchema) {
    await getFirestore()
      .collection(COLLECTION_PATIENTS.name)
      .doc(schema.uid)
      .create(schema);
  }

  async getPatient(patientUid: string): Promise<PatientSchema | null> {
    const docSnapshot = await getFirestore()
      .collection(COLLECTION_PATIENTS.name)
      .doc(patientUid)
      .get();

    return (docSnapshot.data() as PatientSchema | undefined) ?? null;
  }

  async updatePatient(
    patientUid: string,
    fieldsToUpdate: Partial<Record<keyof PatientSchema, any>>
  ): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_PATIENTS.name)
      .doc(patientUid)
      .update(fieldsToUpdate);
  }

  async addSharingDoctorUidToPatient(args: {
    patientUid: string;
    doctorUid: string;
  }): Promise<void> {
    const { patientUid, doctorUid } = args;

    await this.updatePatient(patientUid, {
      sharingToDoctorUidList: FieldValue.arrayUnion(doctorUid),
    });
  }

  async removeSharingDoctorUidFromPatient(args: {
    patientUid: string;
    doctorUid: string;
  }): Promise<void> {
    const { patientUid, doctorUid } = args;

    await this.updatePatient(patientUid, {
      sharingToDoctorUidList: FieldValue.arrayRemove(doctorUid),
    });
  }
}
