import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { AppointmentStatus } from '../constants/enum.constant';
import { DoctorService } from '../modules/doctor/doctor.service';
import { PatientService } from '../modules/patient/patient.service';
import { AuthRepository } from '../modules/shared/repositories/auth.repository';
import { DoctorBalanceInfoRepository } from '../modules/shared/repositories/doctor-balance-info.repository';
import { DoctorWorkScheduleRepository } from '../modules/shared/repositories/doctor-work-schedule.repository';
import { DoctorRepository } from '../modules/shared/repositories/doctor.repository';
import { PatientDoctorConnectionRepository } from '../modules/shared/repositories/patient-doctor-connection.repository';
import { PatientRepository } from '../modules/shared/repositories/patient.repository';
import { DoctorOccupationRepository } from '../modules/shared/repositories/doctor-monthly-occupation.repository';
import { logDebug } from '../utils/logger.util';
import { SaleStatisticsByYearRepository } from '../modules/shared/repositories/sales-statistics-by-year.repository';
import { SystemStatisticsByMonthRepository } from '../modules/shared/repositories/system-statistics-by-month.repository';
import { DeviceService } from '../modules/devices/device.service';
import { DevicesInfoRepository } from '../modules/shared/repositories/devices-info-repository';
import { SettingsRepository } from '../modules/shared/repositories/settings.repository';
import { UserRepository } from '../modules/shared/repositories/user.repository';
import { OrganizationRepository } from '../modules/shared/repositories/organization.repository';
import { UserService } from '../modules/user/user.service';

const LOG_TYPE = 'MOCK';
const MOCK_FIRESTORE_INFO = {
  collectionName: 'mock',
  docId: 'mockStatus',
};

interface MockStatus {
  isWritten: boolean;
}

const isMockWritten = async (): Promise<MockStatus | undefined> => {
  const docSnapshot = await getFirestore()
    .collection(MOCK_FIRESTORE_INFO.collectionName)
    .doc(MOCK_FIRESTORE_INFO.docId)
    .get();

  return docSnapshot.data() as MockStatus | undefined;
};
const writeMockStatus = async () => {
  const mockStatus: MockStatus = {
    isWritten: true,
  };

  await getFirestore()
    .collection(MOCK_FIRESTORE_INFO.collectionName)
    .doc(MOCK_FIRESTORE_INFO.docId)
    .set(mockStatus);
};

export const initMock = async () => {
  if ((await isMockWritten())?.isWritten) {
    logDebug(LOG_TYPE, 'Mock already written.');
    return;
  }

  // ===== START MOCKING
  const devicesInfoRepository = new DevicesInfoRepository();
  const deviceService = new DeviceService(devicesInfoRepository);
  const authRepository = new AuthRepository();
  const patientRepository = new PatientRepository();
  const doctorRepository = new DoctorRepository(deviceService);
  const patientDoctorConnectionRepository =
    new PatientDoctorConnectionRepository();
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
  const doctorWorkScheduleRepository = new DoctorWorkScheduleRepository(
    doctorRepository
  );
  const doctorOccupationRepository = new DoctorOccupationRepository(
    doctorRepository
  );

  const patientService = new PatientService(
    patientRepository,
    authRepository,
    doctorRepository,
    patientDoctorConnectionRepository,
    doctorWorkScheduleRepository,
    doctorOccupationRepository
  );
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

  // ===== END MOCKING

  await writeMockStatus();

  const userRepository = new UserRepository();
  const organizationRepository = new OrganizationRepository();
  const userService = new UserService(
    userRepository,
    authRepository,
    organizationRepository
  );

  await getAuth().createUser({
    uid: 'mock-staff-uid',
    email: 'staff@test.com',
    password: '123456',
  });
  await userService.createStaff('mock-staff-uid', {
    email: 'nht9499@gmail.com',
  });

  logDebug(LOG_TYPE, 'Mock finished!');
};
