import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { AuthRepository } from '../modules/shared/repositories/auth.repository';
import { logDebug } from '../utils/logger.util';
import { UserRepository } from '../modules/shared/repositories/user.repository';
import { OrganizationRepository } from '../modules/shared/repositories/organization.repository';
import { UserService } from '../modules/user/user.service';
import { SaleStatisticsByYearRepository } from '../modules/shared/repositories/sales-statistics-by-year.repository';

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

  const authRepository = new AuthRepository();

  await writeMockStatus();

  const userRepository = new UserRepository();
  const organizationRepository = new OrganizationRepository();
  const saleStatisticsByYearRepository = new SaleStatisticsByYearRepository();
  const userService = new UserService(
    userRepository,
    authRepository,
    organizationRepository,
    saleStatisticsByYearRepository
  );

  await getAuth().createUser({
    uid: 'mock-staff-uid',
    email: 'staff@test.com',
    password: '123456',
  });
  await userService.createStaff('mock-staff-uid', {
    email: 'nht9499@gmail.com',
  });
  await saleStatisticsByYearRepository.createMockStatistic();

  logDebug(LOG_TYPE, 'Mock finished!');
};
