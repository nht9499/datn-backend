import { Injectable } from '@nestjs/common';
import {
  getFirestore,
  DocumentReference,
  CollectionReference,
  FieldValue,
} from 'firebase-admin/firestore';
import { COLLECTION_DOCTOR_BALANCE_INFOS } from '../../../constants/firestore.constant';
import {
  BankAccountSchema,
  DoctorBalanceInfoSchema,
  IncomeStatisticsByYear,
} from '../../doctor/schemas/doctor-balance-info.schema';
import {
  DepositTransactionSchema,
  IncomeTransactionSchema,
  WithdrawalTransactionSchema,
} from '../../doctor/schemas/doctor-transaction.schema';
import { CustomServerError } from '../../../exceptions/custom-server.exception';
import { OmitStrict } from '../../../utils/type.util';
import { TransactionStatus } from '../../../constants/enum.constant';
import { MonthlyIncome } from '../../doctor/schemas/doctor-balance-info.schema';
import { formatDateToMonthId } from '../../../utils/date.util';
import { SettingsRepository } from './settings.repository';
import { DoctorRepository } from './doctor.repository';
import { SaleStatisticsByYearRepository } from './sales-statistics-by-year.repository';
import { DeviceService } from '../../devices/device.service';
import { MessageNotiDoctor } from '../../../constants/enum.constant';

@Injectable()
export class DoctorBalanceInfoRepository {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly saleStatisticsByYearRepository: SaleStatisticsByYearRepository,
    private readonly deviceService: DeviceService,
    private readonly settingsRepository: SettingsRepository
  ) {}
  // private readonly doctorRepository: DoctorRepository;
  // private readonly settingsRepository: SettingsRepository;
  // private readonly saleStatisticsByYearRepository: SaleStatisticsByYearRepository;
  // private readonly deviceService: DeviceService;
  private getDoctorBalanceInfoDocRef(uid: string): DocumentReference {
    return getFirestore()
      .collection(COLLECTION_DOCTOR_BALANCE_INFOS.name)
      .doc(uid);
  }
  private getDoctorTransactionDocRef(
    doctorUid: string,
    transactionId: string
  ): DocumentReference {
    return getFirestore()
      .collection(COLLECTION_DOCTOR_BALANCE_INFOS.name)
      .doc(doctorUid)
      .collection(COLLECTION_DOCTOR_BALANCE_INFOS.subColTransactions)
      .doc(transactionId);
  }
  private getDoctorMonthlyIncomeDocRef(
    doctorUid: string,
    monthId: string
  ): DocumentReference {
    return getFirestore()
      .collection(COLLECTION_DOCTOR_BALANCE_INFOS.name)
      .doc(doctorUid)
      .collection(COLLECTION_DOCTOR_BALANCE_INFOS.subColMonthlyIncomes)
      .doc(monthId);
  }
  private getDoctorIncomeStatisticsByYearDocRef(
    doctorUid: string,
    yearId: string
  ): DocumentReference {
    return getFirestore()
      .collection(COLLECTION_DOCTOR_BALANCE_INFOS.name)
      .doc(doctorUid)
      .collection(COLLECTION_DOCTOR_BALANCE_INFOS.subColIncomeStatisticsByYear)
      .doc(yearId);
  }

  async addBankAccount(
    doctorUid: string,
    bankAccountSchema: BankAccountSchema
  ): Promise<void> {
    const docRef = this.getDoctorBalanceInfoDocRef(doctorUid);

    await getFirestore().runTransaction(async (t) => {
      const docSnapshot = await t.get(docRef);

      const schema = docSnapshot.data() as DoctorBalanceInfoSchema | undefined;

      // * Create new schema

      if (schema == null) {
        const newSchema: DoctorBalanceInfoSchema = {
          currentBalance: 0,
          bankAccountList: [bankAccountSchema],
        };

        t.set(docRef, newSchema);
        return;
      }

      const newBankAccountList = [...schema.bankAccountList];
      newBankAccountList.push(bankAccountSchema);

      const bankAccountListField: keyof DoctorBalanceInfoSchema =
        'bankAccountList';

      t.update(docRef, { [bankAccountListField]: newBankAccountList });
    });
  }

  async updateBankAccount(
    doctorUid: string,
    bankAccountSchema: OmitStrict<BankAccountSchema, 'id'>,
    bankAccountId: string
  ): Promise<void> {
    const docRef = this.getDoctorBalanceInfoDocRef(doctorUid);

    await getFirestore().runTransaction(async (t) => {
      const docSnapshot = await t.get(docRef);

      const balanceInfo = docSnapshot.data() as DoctorBalanceInfoSchema;
      if (!balanceInfo) {
        throw new CustomServerError({
          message: 'doctor/not-found-balance-info',
        });
      }

      const newBankAccountList = [...balanceInfo.bankAccountList];

      const foundIndex = newBankAccountList.findIndex(
        (bankAccount) => bankAccount.id == bankAccountId
      );

      // throw error if account doesn't exist in schema
      if (foundIndex === -1) {
        throw new CustomServerError({
          message: 'doctor/not-found-bank-account',
        });
      }
      // Update existing account
      else {
        const bankAccountUpdateSchema: BankAccountSchema = {
          id: newBankAccountList[foundIndex].id,
          ...bankAccountSchema,
        };
        newBankAccountList[foundIndex] = bankAccountUpdateSchema;
      }

      const bankAccountListField: keyof DoctorBalanceInfoSchema =
        'bankAccountList';

      t.update(docRef, { [bankAccountListField]: newBankAccountList });
    });
  }

  async deleteBankAccount(
    doctorUid: string,
    bankAccountId: string
  ): Promise<void> {
    const docRef = this.getDoctorBalanceInfoDocRef(doctorUid);

    await getFirestore().runTransaction(async (t) => {
      const docSnapshot = await t.get(docRef);

      const balanceInfo = docSnapshot.data() as DoctorBalanceInfoSchema;
      if (!balanceInfo) {
        throw new CustomServerError({
          message: 'doctor/not-found-balance-info',
        });
      }

      const newBankAccountList = [...balanceInfo.bankAccountList];

      const foundIndex = newBankAccountList.findIndex(
        (account) => account.id == bankAccountId
      );

      // throw error if account doesn't exist in schema
      if (foundIndex === -1) {
        throw new CustomServerError({
          message: 'doctor/not-found-bank-account',
        });
      }
      // delete existing account
      else {
        newBankAccountList.splice(foundIndex, 1);
      }

      const bankAccountListField: keyof DoctorBalanceInfoSchema =
        'bankAccountList';

      t.update(docRef, { [bankAccountListField]: newBankAccountList });
    });
  }

  async getCurrentBalance(doctorUid: string): Promise<number> {
    const docSnapshot = await this.getDoctorBalanceInfoDocRef(doctorUid).get();
    const data = docSnapshot.data() as DoctorBalanceInfoSchema;
    if (!data) {
      throw new CustomServerError({
        message: 'doctor/not-found-balance-info',
      });
    }
    return data.currentBalance;
  }

  async createWithdrawalRequest(
    doctorUid: string,
    withdrawalRequestSchema: OmitStrict<
      WithdrawalTransactionSchema,
      'balanceAfterTransaction'
    >
  ): Promise<void> {
    const currentBalance = await this.getCurrentBalance(doctorUid);
    const schema: WithdrawalTransactionSchema = {
      ...withdrawalRequestSchema,
      balanceAfterTransaction: currentBalance,
    };
    await Promise.all([
      this.getDoctorTransactionDocRef(
        doctorUid,
        withdrawalRequestSchema.id
      ).set(schema),
      this.doctorRepository.updatePrivateWithdrawalSnapshot(
        doctorUid,
        schema.withdrawalTransaction.status,
        false
      ),
    ]);
  }

  async updateWithdrawalStatus(
    doctorUid: string,
    transactionId: string,
    withdrawalStatus: TransactionStatus
  ): Promise<void> {
    await getFirestore().runTransaction(async (t) => {
      const transactionDocRef = this.getDoctorTransactionDocRef(
        doctorUid,
        transactionId
      );
      const balanceInfoDocRef = this.getDoctorBalanceInfoDocRef(doctorUid);

      const docSnapshot = await t.get(transactionDocRef);
      const transactionData = docSnapshot.data() as WithdrawalTransactionSchema;
      if (!transactionData || transactionData.type !== 'withdrawal') {
        throw new CustomServerError({
          message: 'doctor/not-found-transaction',
        });
      }

      const currentBalance = await this.getCurrentBalance(doctorUid);
      const withdrawalTransactionField: keyof WithdrawalTransactionSchema =
        'withdrawalTransaction';
      transactionData.withdrawalTransaction.status = withdrawalStatus;
      const balanceAfterTransactionField: keyof WithdrawalTransactionSchema =
        'balanceAfterTransaction';
      const fieldsToUpdate = {
        [withdrawalTransactionField]: transactionData.withdrawalTransaction,
        [balanceAfterTransactionField]: currentBalance,
      };
      if (withdrawalStatus === 'transfered') {
        // Only update currentBalance and balanceAfterTransaction when status is transfered
        const newCurrentBalance =
          currentBalance -
          transactionData.withdrawalTransaction.withdrawalAmount;
        fieldsToUpdate[balanceAfterTransactionField] = newCurrentBalance;

        const currentBalanceField: keyof DoctorBalanceInfoSchema =
          'currentBalance';
        t.update(balanceInfoDocRef, {
          [currentBalanceField]: newCurrentBalance,
        });
        // log to sale statistic
        console.log(this.saleStatisticsByYearRepository, 'ppppp');
        await this.saleStatisticsByYearRepository.updateDoctorTotalWithdrawal(
          transactionData.withdrawalTransaction.withdrawalAmount
        );
      }
      t.update(transactionDocRef, fieldsToUpdate);

      // update doctor private data
      await this.doctorRepository.updatePrivateWithdrawalSnapshot(
        doctorUid,
        withdrawalStatus,
        true
      );

      // send push notify
      if (withdrawalStatus === 'transfered') {
        this.deviceService.sendPushNotification(doctorUid, {
          title: MessageNotiDoctor.withdrawalTransfered.title,
          description: MessageNotiDoctor.withdrawalTransfered.description,
        });
      } else if (withdrawalStatus === 'rejected') {
        this.deviceService.sendPushNotification(doctorUid, {
          title: MessageNotiDoctor.withdrawalRejected.title,
          description: MessageNotiDoctor.withdrawalRejected.description,
        });
      }
    });
  }

  async createDoctorDeposit(
    doctorUid: string,
    schema: OmitStrict<DepositTransactionSchema, 'balanceAfterTransaction'>
  ): Promise<void> {
    const balanceInfoDocRef = this.getDoctorBalanceInfoDocRef(doctorUid);
    const transactionDocRef = this.getDoctorTransactionDocRef(
      doctorUid,
      schema.id
    );
    const currentBalance = await this.getCurrentBalance(doctorUid);
    const newCurrentBalance =
      currentBalance + schema.depositTransaction.depositAmount;
    const depositSchema: DepositTransactionSchema = {
      ...schema,
      balanceAfterTransaction: newCurrentBalance,
    };
    const batch = getFirestore().batch();

    const currentBalanceField: keyof DoctorBalanceInfoSchema = 'currentBalance';
    batch.update(balanceInfoDocRef, {
      [currentBalanceField]: newCurrentBalance,
    });
    batch.set(transactionDocRef, depositSchema);

    await batch.commit();
  }

  async createIncomeTransaction(
    doctorUid: string,
    incomeSchema: IncomeTransactionSchema
  ): Promise<void> {
    const balanceInfoDocRef = this.getDoctorBalanceInfoDocRef(doctorUid);
    const transactionDocRef = this.getDoctorTransactionDocRef(
      doctorUid,
      incomeSchema.id
    );
    const batch = getFirestore().batch();

    const currentBalanceField: keyof DoctorBalanceInfoSchema = 'currentBalance';
    batch.update(balanceInfoDocRef, {
      [currentBalanceField]: incomeSchema.balanceAfterTransaction,
    });
    batch.set(transactionDocRef, incomeSchema);

    await batch.commit();
  }

  async createOrUpdateMonthlyIncomes(doctorUid: string, schema: MonthlyIncome) {
    const monthId = formatDateToMonthId(new Date());
    await getFirestore().runTransaction(async (t) => {
      const docRef = this.getDoctorMonthlyIncomeDocRef(doctorUid, monthId);
      const snapshot = await t.get(docRef);
      const monthlyIncome = snapshot.data() as MonthlyIncome;
      if (!monthlyIncome) {
        t.create(docRef, schema);
      } else {
        // update existed monthlyIncome
        const appointmentsTotalFeeField: keyof MonthlyIncome =
          'appointmentsTotalFee';
        const appointmentInvoiceListField: keyof MonthlyIncome =
          'appointmentInvoiceList';
        const mauUidListField: keyof MonthlyIncome = 'mauUidList';
        const newAppointmentInvoiceList = [
          ...monthlyIncome.appointmentInvoiceList,
          schema.appointmentInvoiceList[0],
        ];
        const newAppointmentsTotalFee =
          monthlyIncome.appointmentsTotalFee + schema.appointmentsTotalFee;
        t.update(docRef, {
          [appointmentsTotalFeeField]: newAppointmentsTotalFee,
          [appointmentInvoiceListField]: newAppointmentInvoiceList,
          [mauUidListField]: FieldValue.arrayUnion(schema.mauUidList[0]),
        });
      }
    });
  }

  async scheduleMonthlyIncome(
    doctorUid: string
  ): Promise<{ mauCount: number; mauTotalCost: number } | undefined> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const monthId = formatDateToMonthId(yesterday);
    return await getFirestore().runTransaction(async (t) => {
      const docRef = this.getDoctorMonthlyIncomeDocRef(doctorUid, monthId);
      const snapshot = await t.get(docRef);
      const monthlyIncome = snapshot.data() as MonthlyIncome;
      if (!monthlyIncome) return;
      const mauTotalCostField: keyof MonthlyIncome = 'mauTotalCost';
      const finalIncomeField: keyof MonthlyIncome = 'finalIncome';
      let mauTotalCost: number;
      const costPerMau = await this.doctorRepository.getCostPerMau(doctorUid);
      if (!costPerMau) {
        const systemSettings = await this.settingsRepository.getSettings();
        mauTotalCost =
          monthlyIncome.mauUidList.length * systemSettings.doctorCostPerMau;
      } else {
        mauTotalCost = monthlyIncome.mauUidList.length * costPerMau;
      }
      const finalIncome = monthlyIncome.appointmentsTotalFee - mauTotalCost;
      t.update(docRef, {
        [mauTotalCostField]: mauTotalCost,
        [finalIncomeField]: finalIncome,
      });
      const statisticsByYear: IncomeStatisticsByYear = {
        statisticsByMonthList: [
          {
            monthId,
            appointmentsCount: monthlyIncome.appointmentInvoiceList.length,
            appointmentsTotalFee: monthlyIncome.appointmentsTotalFee,
            mauCount: monthlyIncome.mauUidList.length,
            mauTotalCost,
            finalIncome,
          },
        ],
      };
      await this.createOrUpdateStatisticsByYear(doctorUid, statisticsByYear);
      return {
        mauCount: monthlyIncome.mauUidList.length,
        mauTotalCost,
      };
    });
  }

  private async createOrUpdateStatisticsByYear(
    doctorUid: string,
    schema: IncomeStatisticsByYear
  ) {
    const yearId = schema.statisticsByMonthList[0].monthId.slice(0, 4);
    await getFirestore().runTransaction(async (t) => {
      const docRef = this.getDoctorIncomeStatisticsByYearDocRef(
        doctorUid,
        yearId
      );
      const snapshot = await t.get(docRef);
      const incomeStatisticsByYear = snapshot.data() as IncomeStatisticsByYear;
      if (!incomeStatisticsByYear) {
        t.create(docRef, schema);
      } else {
        // update existed monthlyIncome
        const statisticsByMonthListField: keyof IncomeStatisticsByYear =
          'statisticsByMonthList';
        const newStatisticsByMonthList =
          incomeStatisticsByYear.statisticsByMonthList.push(
            schema.statisticsByMonthList[0]
          );
        t.update(docRef, {
          [statisticsByMonthListField]: newStatisticsByMonthList,
        });
      }
    });
  }

  async updateCurrentBalance(doctorUid: string, newBalance: number) {
    const docRef = this.getDoctorBalanceInfoDocRef(doctorUid);

    await getFirestore().runTransaction(async (t) => {
      const docSnapshot = await t.get(docRef);

      const schema = docSnapshot.data() as DoctorBalanceInfoSchema | undefined;

      if (!schema) {
        throw new CustomServerError({
          message: 'doctor/not-found-balance-info',
        });
      }

      const currentBalanceField: keyof DoctorBalanceInfoSchema =
        'currentBalance';
      t.update(docRef, { [currentBalanceField]: newBalance });
    });
  }
}
