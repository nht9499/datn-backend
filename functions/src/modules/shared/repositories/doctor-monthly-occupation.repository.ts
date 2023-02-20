import { Injectable } from '@nestjs/common';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { COLLECTION_DOCTOR_OCCUPATION } from '../../../constants/firestore.constant';
import { CustomServerError } from '../../../exceptions/custom-server.exception';
import { formatDateToMonthId } from '../../../utils/date.util';
import { DoctorRepository } from './doctor.repository';
import {
  MonthlyOccupationSchema,
  OccupiedSlot,
} from '../../doctor/schemas/doctor-monthly-occupation.schema';

@Injectable()
export class DoctorOccupationRepository {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async createOrUpdateOccupied(
    schema: OccupiedSlot,
    args: {
      doctorUid: string;
      monthId: string;
    }
  ): Promise<void> {
    const { doctorUid, monthId } = args;
    const occupationId = doctorUid + '---' + monthId;
    await getFirestore().runTransaction(async (t) => {
      const docRef = getFirestore()
        .collection(COLLECTION_DOCTOR_OCCUPATION.name)
        .doc(occupationId);
      const snapshot = await t.get(docRef);
      const occupation = snapshot.data() as MonthlyOccupationSchema;
      if (!occupation) {
        // create new occupation
        const doctor = await this.doctorRepository.getDoctor(doctorUid);
        if (!doctor) {
          throw new CustomServerError({
            message: 'doctor/not-found',
          });
        }
        const occupationSchema: MonthlyOccupationSchema = {
          id: occupationId,
          doctorUid,
          monthId,
          sharingToPatientUidList: doctor.sharingToPatientUidList,
          occupiedSlotList: [schema],
        };
        t.create(docRef, occupationSchema);
      } else {
        // update existed occupation
        occupation.occupiedSlotList.push(schema);
        t.update(docRef, occupation);
      }
    });
  }

  async addSharingPatientUidToOccupation(args: {
    doctorUid: string;
    patientUid: string;
  }): Promise<void> {
    await getFirestore().runTransaction(async (t) => {
      const { doctorUid, patientUid } = args;
      const monthId = formatDateToMonthId(new Date());
      const colRef = getFirestore().collection(
        COLLECTION_DOCTOR_OCCUPATION.name
      );
      const snapshot = await colRef
        .where('doctorUid', '==', doctorUid)
        .where('monthId', '>=', monthId)
        .get();
      const scheduleList = snapshot.docs.map(
        (doc) => doc.data() as MonthlyOccupationSchema
      );
      if (scheduleList.length === 0) return;
      Promise.all(
        scheduleList.map((schedule) => {
          const sharingToPatientUidListField: keyof MonthlyOccupationSchema =
            'sharingToPatientUidList';
          const occupationId = doctorUid + '---' + schedule.monthId;
          t.update(colRef.doc(occupationId), {
            [sharingToPatientUidListField]: FieldValue.arrayUnion(patientUid),
          });
        })
      );
    });
  }

  async getDoctorOccupationThisMonth(): Promise<MonthlyOccupationSchema[]> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const monthId = formatDateToMonthId(yesterday);
    const colRef = getFirestore().collection(COLLECTION_DOCTOR_OCCUPATION.name);
    const snapshot = await colRef.where('monthId', '==', monthId).get();
    return snapshot.docs.map((doc) => doc.data() as MonthlyOccupationSchema);
  }
}
