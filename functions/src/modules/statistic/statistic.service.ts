import { Injectable } from '@nestjs/common';
import { SystemStatisticsByMonthRepository } from '../shared/repositories/system-statistics-by-month.repository';
import { SystemStatisticsAllTimeRepository } from '../shared/repositories/system-statistic-all-time.repository';
import { SystemStatisticsAllTime } from '../shared/schemas/system-statistics-all-time.schema';
import { SystemStatisticsByMonth } from '../shared/schemas/system-statistics-by-month.schema';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly systemStatisticsByMonthRepository: SystemStatisticsByMonthRepository,
    private readonly systemStatisticsAllTimeRepository: SystemStatisticsAllTimeRepository
  ) {}

  async logNewUser(
    fieldToUpdate: keyof SystemStatisticsByMonth,
    numberToUpdate: 1 | -1
  ) {
    switch (fieldToUpdate) {
      case 'newDoctorsCount':
        await this.systemStatisticsByMonthRepository.updateCountNumber(
          fieldToUpdate,
          numberToUpdate
        );
        break;
      case 'newPatientsCount':
        await this.systemStatisticsByMonthRepository.updateCountNumber(
          fieldToUpdate,
          numberToUpdate
        );
        break;
    }
  }

  async logActivePatientDoctor(args: {
    patientUid: string;
    doctorUid: string;
  }) {
    this.systemStatisticsByMonthRepository.updateActivePatientDoctor(args);
  }

  async logActiveUser(
    fieldToUpdate: keyof SystemStatisticsAllTime,
    numberToUpdate: 1 | -1
  ) {
    switch (fieldToUpdate) {
      case 'currentActivatedDoctorsCount':
        await this.systemStatisticsAllTimeRepository.updateCountNumber(
          fieldToUpdate,
          numberToUpdate
        );
        break;
      case 'currentActivatedPatientsCount':
        await this.systemStatisticsAllTimeRepository.updateCountNumber(
          fieldToUpdate,
          numberToUpdate
        );
        break;
    }
  }
}
