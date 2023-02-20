import { Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_SALES_STATISTICS_BY_YEAR } from '../../../constants/firestore.constant';
import { formatDateToMonthId } from '../../../utils/date.util';
import { logError } from '../../../utils/logger.util';
import {
  SaleStatisticsByYear,
  StatisticsByMonth
} from '../schemas/sales-statistics-by-year.schema';

@Injectable()
export class SaleStatisticsByYearRepository {
  async createOrUpdate(schema: StatisticsByMonth) {
    await getFirestore().runTransaction(async (t) => {
      const yearId = schema.monthId.slice(0, 4);
      const docRef = getFirestore()
        .collection(COLLECTION_SALES_STATISTICS_BY_YEAR.name)
        .doc(yearId);
      const snapshot = await t.get(docRef);
      const salesStatisticsByYear = snapshot.data() as SaleStatisticsByYear;
      if (!salesStatisticsByYear) {
        const salesStatisticsByYearSchema: SaleStatisticsByYear = {
          statisticsByMonthList: [schema]
        };
        t.create(docRef, salesStatisticsByYearSchema);
      } else {
        const foundIndex =
          salesStatisticsByYear.statisticsByMonthList.findIndex(
            (statistics) => statistics.monthId == schema.monthId
          );
        if (foundIndex === -1) {
          salesStatisticsByYear.statisticsByMonthList.push(schema);
        } else {
          // don't update doctorsTotalWithdrawal (this field was updated right after withdrawal transfered)
          schema.doctorsTotalWithdrawal =
            salesStatisticsByYear.statisticsByMonthList[
              foundIndex
            ].doctorsTotalWithdrawal;
          salesStatisticsByYear.statisticsByMonthList[foundIndex] = schema;
        }
        t.update(docRef, salesStatisticsByYear);
      }
    });
  }

  async updateDoctorTotalWithdrawal(withdrawalAmount: number) {
    await getFirestore().runTransaction(async (t) => {
      const monthId = formatDateToMonthId(new Date());
      const yearId = monthId.slice(0, 4);
      const docRef = getFirestore()
        .collection(COLLECTION_SALES_STATISTICS_BY_YEAR.name)
        .doc(yearId);
      const snapshot = await t.get(docRef);
      const salesStatisticsByYear = snapshot.data() as SaleStatisticsByYear;
      const statisticsByMonth: StatisticsByMonth = {
        monthId,
        appointmentsCount: 0,
        appointmentsTotalFee: 0,
        mauCount: 0,
        mauTotalCost: 0,
        doctorsTotalBalance: 0,
        doctorsTotalWithdrawal: withdrawalAmount
      };
      if (!salesStatisticsByYear) {
        const salesStatisticsByYearSchema: SaleStatisticsByYear = {
          statisticsByMonthList: [statisticsByMonth]
        };
        t.create(docRef, salesStatisticsByYearSchema);
      } else {
        const foundIndex =
          salesStatisticsByYear.statisticsByMonthList.findIndex(
            (statistics) => statistics.monthId == monthId
          );
        if (foundIndex === -1) {
          salesStatisticsByYear.statisticsByMonthList.push(statisticsByMonth);
        } else {
          salesStatisticsByYear.statisticsByMonthList[
            foundIndex
          ].doctorsTotalWithdrawal += withdrawalAmount;
        }
        t.update(docRef, salesStatisticsByYear);
      }
    });
  }
}
