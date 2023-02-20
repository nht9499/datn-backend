// +0700
export const TIMEZONE_STR = 'Asia/Bangkok';

export const COLLECTION_USERS = {
  name: 'users',
} as const;
export const COLLECTION_ORGANIZATIONS = {
  name: 'organizations',
} as const;
export const COLLECTION_TEST_RESULTS = {
  name: 'testResults',
} as const;

export const COLLECTION_PATIENTS = {
  name: 'patients',
} as const;

export const COLLECTION_DOCTORS = {
  name: 'doctors',

  subColPrivates: 'privates',
  privateDataDocId: 'privateData',
} as const;

export const COLLECTION_PATIENT_DOCTOR_CONNECTIONS = {
  name: 'patientDoctorConnections',

  subColPatientMedicalRecords: 'patientMedicalRecords',
  subColPrivateNotes: 'privateNotes',
} as const;

export const COLLECTION_STAFFS = {
  name: 'staffs',
} as const;

export const COLLECTION_SETTINGS = {
  name: 'settings',
  docId: 'settings',
} as const;

export const COLLECTION_VERSION_SETTINGS = {
  name: 'versionSettings',
  docId: 'versionSettings',
} as const;

export const COLLECTION_DOCTOR_BALANCE_INFOS = {
  name: 'doctorBalanceInfos',

  subColTransactions: 'transactions',
  subColMonthlyIncomes: 'monthlyIncomes',
  subColIncomeStatisticsByYear: 'incomeStatisticsByYear',
};

export const COLLECTION_DOCTOR_SCHEDULE = {
  name: 'doctorMonthlyWorkSchedules',
};

export const COLLECTION_APPOINTMENTS = {
  name: 'appointments',
};

export const COLLECTION_DOCTOR_OCCUPATION = {
  name: 'doctorMonthlyOccupations',
};

export const COLLECTION_DEVICE_INFO = {
  name: 'devicesInfos',
} as const;

export const COLLECTION_SALES_STATISTICS_BY_YEAR = {
  name: 'salesStatisticsByYear',
};

export const COLLECTION_SYSTEM_STATISTICS_BY_MONTH = {
  name: 'systemStatisticsByMonth',
};

export const COLLECTION_SYSTEM_STATISTICS_ALL_TIME = {
  name: 'systemStatisticsAllTime',
  docId: 'allTime',
};
