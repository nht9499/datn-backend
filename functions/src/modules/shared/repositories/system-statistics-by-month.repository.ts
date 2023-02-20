import { Injectable } from '@nestjs/common';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_SYSTEM_STATISTICS_BY_MONTH } from '../../../constants/firestore.constant';
import { formatDateToMonthId } from '../../../utils/date.util';
import { SystemStatisticsByMonth } from '../schemas/system-statistics-by-month.schema';

@Injectable()
export class SystemStatisticsByMonthRepository {
  async updateActivePatientDoctor(args: {
    patientUid: string;
    doctorUid: string;
  }) {
    const { patientUid, doctorUid } = args;
    await getFirestore().runTransaction(async (t) => {
      const monthId = formatDateToMonthId(new Date());
      const docRef = getFirestore()
        .collection(COLLECTION_SYSTEM_STATISTICS_BY_MONTH.name)
        .doc(monthId);
      const snapshot = await t.get(docRef);
      const systemStatisticsByMonth =
        snapshot.data() as SystemStatisticsByMonth;
      const schema: SystemStatisticsByMonth = {
        newDoctorsCount: 0,
        activeDoctorUidList: [],
        doctorsTotalIncome: 0,
        newPatientsCount: 0,
        activePatientUidList: [],
        patientsTotalPaidAmount: 0
      };
      if (!systemStatisticsByMonth) {
        schema.activeDoctorUidList = [doctorUid];
        schema.activePatientUidList = [patientUid];
        t.create(docRef, schema);
      } else {
        const activeDoctorUidListField: keyof SystemStatisticsByMonth =
          'activeDoctorUidList';
        const activePatientUidListField: keyof SystemStatisticsByMonth =
          'activePatientUidList';
        t.update(docRef, {
          [activeDoctorUidListField]: FieldValue.arrayUnion(doctorUid),
          [activePatientUidListField]: FieldValue.arrayUnion(patientUid)
        });
      }
    });
  }
  async updateCountNumber(
    fieldToUpdate: keyof SystemStatisticsByMonth,
    dataFieldToUpdate: number
  ) {
    await getFirestore().runTransaction(async (t) => {
      const monthId = formatDateToMonthId(new Date());
      const docRef = getFirestore()
        .collection(COLLECTION_SYSTEM_STATISTICS_BY_MONTH.name)
        .doc(monthId);
      const snapshot = await t.get(docRef);
      const systemStatisticsByMonth =
        snapshot.data() as SystemStatisticsByMonth;
      if (!systemStatisticsByMonth) {
        const schema: SystemStatisticsByMonth = {
          newDoctorsCount: 0,
          activeDoctorUidList: [],
          doctorsTotalIncome: 0,
          newPatientsCount: 0,
          activePatientUidList: [],
          patientsTotalPaidAmount: 0
        };
        switch (fieldToUpdate) {
          case 'newDoctorsCount':
            schema.newDoctorsCount = dataFieldToUpdate;
            break;
          case 'newPatientsCount':
            schema.newPatientsCount = dataFieldToUpdate;
            break;
        }
        t.create(docRef, schema);
      } else {
        t.update(docRef, {
          [fieldToUpdate]: FieldValue.increment(dataFieldToUpdate)
        });
      }
    });
  }

  async updateMonthly(
    doctorsTotalIncome: number,
    patientsTotalPaidAmount: number
  ) {
    await getFirestore().runTransaction(async (t) => {
      const monthId = formatDateToMonthId(new Date());
      const docRef = getFirestore()
        .collection(COLLECTION_SYSTEM_STATISTICS_BY_MONTH.name)
        .doc(monthId);
      const snapshot = await t.get(docRef);
      const systemStatisticsByMonth =
        snapshot.data() as SystemStatisticsByMonth;
      if (!systemStatisticsByMonth) {
        const schema: SystemStatisticsByMonth = {
          newDoctorsCount: 0,
          activeDoctorUidList: [],
          doctorsTotalIncome,
          newPatientsCount: 0,
          activePatientUidList: [],
          patientsTotalPaidAmount
        };
        t.create(docRef, schema);
      } else {
        const doctorsTotalIncomeField: keyof SystemStatisticsByMonth =
          'doctorsTotalIncome';
        const patientsTotalPaidAmountField: keyof SystemStatisticsByMonth =
          'patientsTotalPaidAmount';
        t.update(docRef, {
          [doctorsTotalIncomeField]: doctorsTotalIncome,
          [patientsTotalPaidAmountField]: patientsTotalPaidAmount
        });
      }
    });
  }
}
