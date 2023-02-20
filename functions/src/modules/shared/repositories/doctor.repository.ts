import { Injectable } from '@nestjs/common';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { COLLECTION_DOCTORS } from '../../../constants/firestore.constant';
import { DoctorSchema } from '../../doctor/schemas/doctor.schema';
import {
  DoctorPrivateDataSchema,
  WithdrawalSnapshot,
} from '../../doctor/schemas/doctor-private-data.schema';
import { DeviceService } from '../../devices/device.service';
import {
  MessageNotiDoctor,
  TransactionStatus,
} from '../../../constants/enum.constant';

@Injectable()
export class DoctorRepository {
  constructor(private readonly deviceService: DeviceService) {}
  // private readonly deviceService: DeviceService;
  async createDoctor(
    doctorUid: string,
    schema: DoctorSchema,
    privateSchema: DoctorPrivateDataSchema
  ) {
    const doctorDocRef = getFirestore()
      .collection(COLLECTION_DOCTORS.name)
      .doc(doctorUid);

    const doctorPrivateDocRef = doctorDocRef
      .collection(COLLECTION_DOCTORS.subColPrivates)
      .doc(COLLECTION_DOCTORS.privateDataDocId);

    const batch = getFirestore().batch();

    batch.create(doctorDocRef, schema);
    batch.create(doctorPrivateDocRef, privateSchema);

    await batch.commit();
  }

  async getDoctor(doctorUid: string): Promise<DoctorSchema | null> {
    const docSnapshot = await getFirestore()
      .collection(COLLECTION_DOCTORS.name)
      .doc(doctorUid)
      .get();

    return (docSnapshot.data() as DoctorSchema | undefined) ?? null;
  }

  async updateDoctor(args: {
    doctorUid: string;
    fieldsToUpdate?: Partial<Record<keyof DoctorSchema, any>>;
    privateFieldsToUpdate?: Partial<DoctorPrivateDataSchema>;
  }): Promise<void> {
    const { doctorUid, fieldsToUpdate, privateFieldsToUpdate } = args;

    const doctorDocRef = getFirestore()
      .collection(COLLECTION_DOCTORS.name)
      .doc(doctorUid);

    const doctorPrivateDocRef = doctorDocRef
      .collection(COLLECTION_DOCTORS.subColPrivates)
      .doc(COLLECTION_DOCTORS.privateDataDocId);

    const batch = getFirestore().batch();

    if (fieldsToUpdate != null) {
      const finalFieldsToUpdate: Partial<Record<keyof DoctorSchema, any>> = {
        ...fieldsToUpdate,
        updatedAt: Timestamp.now(),
      };
      batch.update(doctorDocRef, finalFieldsToUpdate);
    }
    const personalIdCardImageUrlListField: keyof DoctorPrivateDataSchema =
      'personalIdCardImageUrlList';
    const practisingCertificateImageUrlListField: keyof DoctorPrivateDataSchema =
      'practisingCertificateImageUrlList';
    const otherCertificateImageUrlListField: keyof DoctorPrivateDataSchema =
      'otherCertificateImageUrlList';
    const costPerMauField: keyof DoctorPrivateDataSchema = 'costPerMau';

    if (privateFieldsToUpdate) {
      batch.update(doctorPrivateDocRef, {
        ...(privateFieldsToUpdate.personalIdCardImageUrlList && {
          [personalIdCardImageUrlListField]:
            privateFieldsToUpdate.personalIdCardImageUrlList,
        }),
        ...(privateFieldsToUpdate.practisingCertificateImageUrlList && {
          [practisingCertificateImageUrlListField]:
            privateFieldsToUpdate.practisingCertificateImageUrlList,
        }),
        ...(privateFieldsToUpdate.otherCertificateImageUrlList && {
          [otherCertificateImageUrlListField]:
            privateFieldsToUpdate.otherCertificateImageUrlList,
        }),
        ...(privateFieldsToUpdate.costPerMau && {
          [costPerMauField]: privateFieldsToUpdate.costPerMau,
        }),
      });
    }

    await batch.commit();
    if (fieldsToUpdate?.status) {
      if (fieldsToUpdate.status === 'activated') {
        this.deviceService.sendPushNotification(doctorUid, {
          title: MessageNotiDoctor.accountActivated.title,
          description: MessageNotiDoctor.accountActivated.description,
        });
      }
    }
  }

  async addSharingPatientUidToDoctor(args: {
    doctorUid: string;
    patientUid: string;
  }): Promise<void> {
    const { doctorUid, patientUid } = args;

    await this.updateDoctor({
      doctorUid,
      fieldsToUpdate: {
        sharingToPatientUidList: FieldValue.arrayUnion(patientUid),
      },
    });
  }

  async removeSharingPatientUidFromDoctor(args: {
    doctorUid: string;
    patientUid: string;
  }): Promise<void> {
    const { doctorUid, patientUid } = args;

    await this.updateDoctor({
      doctorUid,
      fieldsToUpdate: {
        sharingToPatientUidList: FieldValue.arrayRemove(patientUid),
      },
    });
  }

  async getCostPerMau(doctorUid: string): Promise<number | null> {
    const snapshot = await getFirestore()
      .collection(COLLECTION_DOCTORS.name)
      .doc(doctorUid)
      .collection(COLLECTION_DOCTORS.subColPrivates)
      .doc(COLLECTION_DOCTORS.privateDataDocId)
      .get();
    const data = snapshot.data() as DoctorPrivateDataSchema;
    return data.costPerMau;
  }

  async updatePrivateWithdrawalSnapshot(
    doctorUid: string,
    status: TransactionStatus,
    isUpdateStatus: boolean
  ) {
    await getFirestore().runTransaction(async (t) => {
      const docRef = getFirestore()
        .collection(COLLECTION_DOCTORS.name)
        .doc(doctorUid)
        .collection(COLLECTION_DOCTORS.subColPrivates)
        .doc(COLLECTION_DOCTORS.privateDataDocId);
      const snapshot = await t.get(docRef);
      const data = snapshot.data() as DoctorPrivateDataSchema;
      if (!data) return;
      const lastWithdrawalSnapshotField: keyof DoctorPrivateDataSchema =
        'lastWithdrawalSnapshot';
      let withdrawalSnapshot: WithdrawalSnapshot = {
        status,
        createdAt: Timestamp.now(),
      };
      if (isUpdateStatus) {
        withdrawalSnapshot.createdAt =
          data.lastWithdrawalSnapshot?.createdAt ?? Timestamp.now();
      }
      t.update(docRef, {
        [lastWithdrawalSnapshotField]: withdrawalSnapshot,
      });
    });
  }
}
