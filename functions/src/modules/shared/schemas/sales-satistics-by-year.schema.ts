export interface SaleStatisticsByYear {
  totalUserThisYear: number;
  statisticsByMonthList: StatisticsByMonth[];
}

export interface StatisticsByMonth {
  monthId: string;
  fileCount: number;
  newUserCount: number;
  testCount: number;
}
