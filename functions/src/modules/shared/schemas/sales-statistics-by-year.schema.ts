export interface SaleStatisticsByYear {
  statisticsByMonthList: StatisticsByMonth[];
}

export interface StatisticsByMonth {
  monthId: string;
  appointmentsCount: number;
  appointmentsTotalFee: number;
  mauCount: number;
  mauTotalCost: number;
  doctorsTotalBalance: number;
  doctorsTotalWithdrawal: number;
}
