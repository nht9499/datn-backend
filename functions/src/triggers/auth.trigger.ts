import { Change, firestore, region } from 'firebase-functions';
import { appRegion } from '../app.config';
import { DoctorStatus, PatientStatus } from '../constants/enum.constant';
import {
  COLLECTION_DOCTORS,
  COLLECTION_PATIENTS
} from '../constants/firestore.constant';
import { DoctorSchema } from '../modules/doctor/schemas/doctor.schema';
import { PatientSchema } from '../modules/patient/schemas/patient.schema';
import { StatisticsService } from '../modules/statistic/statistic.service';
import { SystemStatisticsByMonthRepository } from '../modules/shared/repositories/system-statistics-by-month.repository';
import { SystemStatisticsAllTimeRepository } from '../modules/shared/repositories/system-statistic-all-time.repository';

const userTriggerPath = `${COLLECTION_DOCTORS.name}/{uid}`;
export const onDoctorWrite = region(appRegion)
  .runWith({ minInstances: 0, memory: '256MB' })
  .firestore.document(userTriggerPath)
  .onWrite((change, context) =>
    handleAccountWrite<DoctorSchema>(change, 'doctor')
  );

const driverTriggerPath = `${COLLECTION_PATIENTS.name}/{uid}`;
export const onPatientWrite = region(appRegion)
  .runWith({ minInstances: 0, memory: '256MB' })
  .firestore.document(driverTriggerPath)
  .onWrite((change, context) =>
    handleAccountWrite<PatientSchema>(change, 'patient')
  );

interface BaseAccountSchema {
  status: DoctorStatus | PatientStatus;
}

type AccountType = 'doctor' | 'patient';

const handleAccountWrite = async <T extends BaseAccountSchema>(
  change: Change<firestore.DocumentSnapshot>,
  accountType: AccountType
): Promise<any> => {
  const docSnapshotBefore = change.before;
  const docSnapshotAfter = change.after;

  const docBefore = docSnapshotBefore.data() as T | undefined;
  const docAfter = docSnapshotAfter.data() as T | undefined;

  const systemStatisticsByMonthRepository =
    new SystemStatisticsByMonthRepository();
  const systemStatisticsAllTimeRepository =
    new SystemStatisticsAllTimeRepository();
  const statisticsService = new StatisticsService(
    systemStatisticsByMonthRepository,
    systemStatisticsAllTimeRepository
  );

  // * Non-overall Stats
  // Increment if a new account is created
  if (docBefore == null && docAfter != null) {
    switch (accountType) {
      case 'doctor':
        await statisticsService.logNewUser('newDoctorsCount', 1);
        break;
      case 'patient':
        await statisticsService.logNewUser('newPatientsCount', 1);
        break;
    }
  }

  // * Overall Stats
  // Increment/decrement depending on the updated value
  if (docBefore?.status !== 'activated' && docAfter?.status === 'activated') {
    switch (accountType) {
      case 'doctor':
        await statisticsService.logActiveUser(
          'currentActivatedDoctorsCount',
          1
        );
        break;
      case 'patient':
        await statisticsService.logActiveUser(
          'currentActivatedPatientsCount',
          1
        );
        break;
    }
  } else if (
    docBefore?.status !== 'deactivated' &&
    docAfter?.status === 'deactivated'
  ) {
    switch (accountType) {
      case 'doctor':
        await statisticsService.logActiveUser(
          'currentActivatedDoctorsCount',
          -1
        );
        break;
      case 'patient':
        await statisticsService.logActiveUser(
          'currentActivatedPatientsCount',
          -1
        );
        break;
    }
  } else if (docBefore && !docAfter) {
    switch (accountType) {
      case 'doctor':
        await statisticsService.logActiveUser(
          'currentActivatedDoctorsCount',
          -1
        );
        break;
      case 'patient':
        await statisticsService.logActiveUser(
          'currentActivatedPatientsCount',
          -1
        );
        break;
    }
  }
};
