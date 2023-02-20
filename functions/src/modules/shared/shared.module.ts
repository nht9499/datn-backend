import { Module } from '@nestjs/common';
import { AuthRepository } from './repositories/auth.repository';
import { DevicesInfoRepository } from './repositories/devices-info-repository';
import { PatientRepository } from './repositories/patient.repository';
import { SettingsRepository } from './repositories/settings.repository';
import { DoctorRepository } from './repositories/doctor.repository';
import { PatientDoctorConnectionRepository } from './repositories/patient-doctor-connection.repository';
import { DoctorWorkScheduleRepository } from './repositories/doctor-work-schedule.repository';
import { DoctorBalanceInfoRepository } from './repositories/doctor-balance-info.repository';
import { AppointmentRepository } from './repositories/appointment.repository';
import { DoctorOccupationRepository } from './repositories/doctor-monthly-occupation.repository';
import { SaleStatisticsByYearRepository } from './repositories/sales-statistics-by-year.repository';
import { SystemStatisticsByMonthRepository } from './repositories/system-statistics-by-month.repository';
import { SystemStatisticsAllTimeRepository } from './repositories/system-statistic-all-time.repository';
import { DeviceService } from '../devices/device.service';
import { StatisticsService } from '../statistic/statistic.service';
import { EmailService } from '../email/email.service';
import { UserRepository } from './repositories/user.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { TestRepository } from './repositories/test.repository';

@Module({
  imports: [],
  providers: [
    AuthRepository,
    SettingsRepository,
    DevicesInfoRepository,
    PatientRepository,
    DoctorRepository,
    PatientDoctorConnectionRepository,
    DoctorWorkScheduleRepository,
    DoctorBalanceInfoRepository,
    AppointmentRepository,
    DoctorOccupationRepository,
    SaleStatisticsByYearRepository,
    SystemStatisticsByMonthRepository,
    SystemStatisticsAllTimeRepository,
    DeviceService,
    StatisticsService,
    EmailService,
    UserRepository,
    OrganizationRepository,
    TestRepository,
  ],
  exports: [
    AuthRepository,
    SettingsRepository,
    DevicesInfoRepository,
    PatientRepository,
    DoctorRepository,
    PatientDoctorConnectionRepository,
    DoctorWorkScheduleRepository,
    DoctorBalanceInfoRepository,
    AppointmentRepository,
    DoctorOccupationRepository,
    SaleStatisticsByYearRepository,
    SystemStatisticsByMonthRepository,
    SystemStatisticsAllTimeRepository,
    DeviceService,
    StatisticsService,
    EmailService,
    UserRepository,
    OrganizationRepository,
    TestRepository,
  ],
})
export class SharedModule {}
