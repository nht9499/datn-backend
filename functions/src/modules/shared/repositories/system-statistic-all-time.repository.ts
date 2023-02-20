import { Injectable } from '@nestjs/common';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_SYSTEM_STATISTICS_ALL_TIME } from '../../../constants/firestore.constant';
import { formatDateToMonthId } from '../../../utils/date.util';
import { SystemStatisticsAllTime } from '../schemas/system-statistics-all-time.schema';

@Injectable()
export class SystemStatisticsAllTimeRepository {
  async updateCountNumber(
    fieldToUpdate: keyof SystemStatisticsAllTime,
    dataFieldToUpdate: number
  ) {
    await getFirestore().runTransaction(async (t) => {
      const docRef = getFirestore()
        .collection(COLLECTION_SYSTEM_STATISTICS_ALL_TIME.name)
        .doc(COLLECTION_SYSTEM_STATISTICS_ALL_TIME.docId);
      const snapshot = await t.get(docRef);
      const systemStatisticsByMonth =
        snapshot.data() as SystemStatisticsAllTime;
      if (!systemStatisticsByMonth) {
        const schema: SystemStatisticsAllTime = {
          currentActivatedDoctorsCount: 0,
          currentActivatedPatientsCount: 0,
        };
        switch (fieldToUpdate) {
          case 'currentActivatedDoctorsCount':
            schema.currentActivatedDoctorsCount = dataFieldToUpdate;
            break;
          case 'currentActivatedPatientsCount':
            schema.currentActivatedPatientsCount = dataFieldToUpdate;
            break;
        }
        t.create(docRef, schema);
      } else {
        t.update(docRef, {
          [fieldToUpdate]: FieldValue.increment(dataFieldToUpdate),
        });
      }
    });
  }
}
