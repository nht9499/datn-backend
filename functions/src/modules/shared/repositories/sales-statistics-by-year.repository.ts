import { Injectable } from '@nestjs/common';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_SALES_STATISTICS_BY_YEAR } from '../../../constants/firestore.constant';
import { formatDateToMonthId } from '../../../utils/date.util';
import { logError } from '../../../utils/logger.util';
import {
  SaleStatisticsByYear,
  StatisticsByMonth,
} from '../schemas/sales-satistics-by-year.schema';

@Injectable()
export class SaleStatisticsByYearRepository {
  async updateStatistics(schema: StatisticsByMonth) {
    await getFirestore().runTransaction(async (t) => {
      const monthId = formatDateToMonthId(new Date());
      const yearId = monthId.slice(0, 4);
      const docRef = getFirestore()
        .collection(COLLECTION_SALES_STATISTICS_BY_YEAR.name)
        .doc(yearId);
      const snapshot = await t.get(docRef);
      const salesStatisticsByYear = snapshot.data() as SaleStatisticsByYear;
      if (!salesStatisticsByYear) {
        const salesStatisticsByYearSchema: SaleStatisticsByYear = {
          totalUserThisYear: schema.newUserCount,
          statisticsByMonthList: [schema],
        };
        t.create(docRef, salesStatisticsByYearSchema);
      } else {
        const foundIndex =
          salesStatisticsByYear.statisticsByMonthList.findIndex(
            (statistics) => statistics.monthId == monthId
          );
        if (foundIndex === -1) {
          salesStatisticsByYear.statisticsByMonthList.push(schema);
        } else {
          if (schema.newUserCount) {
            salesStatisticsByYear.totalUserThisYear += schema.newUserCount;
          }
          salesStatisticsByYear.statisticsByMonthList[foundIndex].fileCount +=
            schema.fileCount;
          salesStatisticsByYear.statisticsByMonthList[
            foundIndex
          ].newUserCount += schema.newUserCount;
          salesStatisticsByYear.statisticsByMonthList[foundIndex].testCount +=
            schema.testCount;
        }
        t.update(docRef, salesStatisticsByYear);
      }
    });
  }

  async createMockStatistic() {
    const monthId = formatDateToMonthId(new Date());
    const yearId = monthId.slice(0, 4);
    const docRef = getFirestore()
      .collection(COLLECTION_SALES_STATISTICS_BY_YEAR.name)
      .doc(yearId);
    const newDate = new Date();
    const mockData: SaleStatisticsByYear = {
      totalUserThisYear: 25,
      statisticsByMonthList: [
        {
          monthId: formatDateToMonthId(
            new Date(new Date().setMonth(newDate.getMonth() - 3))
          ),
          fileCount: 27,
          newUserCount: 9,
          testCount: 15,
        },
        {
          monthId: formatDateToMonthId(
            new Date(new Date().setMonth(newDate.getMonth() - 2))
          ),
          fileCount: 34,
          newUserCount: 14,
          testCount: 20,
        },
        {
          monthId: formatDateToMonthId(
            new Date(new Date().setMonth(newDate.getMonth() - 1))
          ),
          fileCount: 34,
          newUserCount: 2,
          testCount: 30,
        },
      ],
    };
    docRef.set(mockData);
  }
}
