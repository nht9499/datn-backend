import { Timestamp } from 'firebase-admin/firestore';
import { Gender } from '../../../constants/enum.constant';

export interface DoctorBalanceInfoSchema {
  currentBalance: number;
  bankAccountList: BankAccountSchema[];
}

export interface BankAccountSchema {
  id: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface MonthlyIncome {
  appointmentsTotalFee: number;
  appointmentInvoiceList: AppointmentInvoice[];
  mauUidList: string[];
  mauTotalCost: number | null;
  finalIncome: number | null;
}

interface AppointmentInvoice {
  patientSnapshot: PatientSnapshot;
  appointmentStartAt: Timestamp;
  orgDurationInMinutes: number;
  // actualDurationInMinutes: number;
  appointmentFee: number;
}

interface PatientSnapshot {
  phoneNumber: string;
  avatarImageUrl: string | null;
  fullName: string;
  dob: Timestamp;
  gender: Gender;
  email: string | null;
}

export interface IncomeStatisticsByYear {
  statisticsByMonthList: StatisticsByMonth[];
}

interface StatisticsByMonth {
  monthId: string;
  appointmentsCount: number;
  appointmentsTotalFee: number;
  mauCount: number;
  mauTotalCost: number;
  finalIncome: number;
}
