import { appRegion } from '../app.config';
import { region } from 'firebase-functions';
import { AppointmentService } from '../modules/appointment/appointment.service';
import { AppointmentRepository } from '../modules/shared/repositories/appointment.repository';
import { AuthRepository } from '../modules/shared/repositories/auth.repository';
import { DoctorRepository } from '../modules/shared/repositories/doctor.repository';
import { PatientDoctorConnectionRepository } from '../modules/shared/repositories/patient-doctor-connection.repository';
import { PatientRepository } from '../modules/shared/repositories/patient.repository';
import { DoctorOccupationRepository } from '../modules/shared/repositories/doctor-monthly-occupation.repository';
import { DoctorService } from '../modules/doctor/doctor.service';
import { DoctorWorkScheduleRepository } from '../modules/shared/repositories/doctor-work-schedule.repository';
import { DoctorBalanceInfoRepository } from '../modules/shared/repositories/doctor-balance-info.repository';
import { SaleStatisticsByYearRepository } from '../modules/shared/repositories/sales-statistics-by-year.repository';
import { SystemStatisticsByMonthRepository } from '../modules/shared/repositories/system-statistics-by-month.repository';
import { DeviceService } from '../modules/devices/device.service';
import { DevicesInfoRepository } from '../modules/shared/repositories/devices-info-repository';
import { StatisticsService } from '../modules/statistic/statistic.service';
import { SystemStatisticsAllTimeRepository } from '../modules/shared/repositories/system-statistic-all-time.repository';
import { SettingsRepository } from '../modules/shared/repositories/settings.repository';

export const checkSystemPeriodically = async () => {
  const devicesInfoRepository = new DevicesInfoRepository();
  const deviceService = new DeviceService(devicesInfoRepository);
  const appointmentRepository = new AppointmentRepository();
  const authRepository = new AuthRepository();
  const doctorRepository = new DoctorRepository(deviceService);
  const patientDoctorConnectionRepository =
    new PatientDoctorConnectionRepository();
  const patientRepository = new PatientRepository();
  const doctorOccupationRepository = new DoctorOccupationRepository(
    doctorRepository
  );
  const saleStatisticsByYearRepository = new SaleStatisticsByYearRepository();
  const settingsRepository = new SettingsRepository();
  const doctorBalanceInfoRepository = new DoctorBalanceInfoRepository(
    doctorRepository,
    saleStatisticsByYearRepository,
    deviceService,
    settingsRepository
  );
  const systemStatisticsByMonthRepository =
    new SystemStatisticsByMonthRepository();
  const systemStatisticsAllTimeRepository =
    new SystemStatisticsAllTimeRepository();
  const statisticsService = new StatisticsService(
    systemStatisticsByMonthRepository,
    systemStatisticsAllTimeRepository
  );

  const appointmentService = new AppointmentService(
    patientRepository,
    authRepository,
    doctorRepository,
    patientDoctorConnectionRepository,
    appointmentRepository,
    doctorOccupationRepository,
    doctorBalanceInfoRepository,
    systemStatisticsByMonthRepository,
    deviceService,
    statisticsService
  );

  await appointmentService.checkAndCreateMeetings();
};

export const staleSystemsCheck = region(appRegion)
  .runWith({
    minInstances: 1,
    memory: '128MB',
  })
  .pubsub.schedule('every 1 minutes')
  .onRun(checkSystemPeriodically);

export const monthlySystemCheck = region(appRegion)
  .runWith({
    minInstances: 1,
    memory: '128MB',
  })
  .pubsub.schedule('00 9 1 * *')
  .onRun(async () => {
    const devicesInfoRepository = new DevicesInfoRepository();
    const deviceService = new DeviceService(devicesInfoRepository);
    const authRepository = new AuthRepository();
    const doctorRepository = new DoctorRepository(deviceService);
    const patientDoctorConnectionRepository =
      new PatientDoctorConnectionRepository();
    const doctorOccupationRepository = new DoctorOccupationRepository(
      doctorRepository
    );
    const doctorWorkScheduleRepository = new DoctorWorkScheduleRepository(
      doctorRepository
    );
    const settingsRepository = new SettingsRepository();
    const saleStatisticsByYearRepository = new SaleStatisticsByYearRepository();
    const doctorBalanceInfoRepository = new DoctorBalanceInfoRepository(
      doctorRepository,
      saleStatisticsByYearRepository,
      deviceService,
      settingsRepository
    );
    const systemStatisticsByMonthRepository =
      new SystemStatisticsByMonthRepository();

    const doctorService = new DoctorService(
      doctorRepository,
      authRepository,
      patientDoctorConnectionRepository,
      doctorWorkScheduleRepository,
      doctorBalanceInfoRepository,
      doctorOccupationRepository,
      saleStatisticsByYearRepository,
      systemStatisticsByMonthRepository
    );

    await doctorService.summaryMonthlyIncome();
  });
