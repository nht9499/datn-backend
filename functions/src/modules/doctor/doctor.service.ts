import { Injectable } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { CustomFirebaseError } from '../../exceptions/custom-firebase.exception';
import { CustomServerError } from '../../exceptions/custom-server.exception';
import {
  formatDateToMonthId,
  timestampFromIsoString,
} from '../../utils/date.util';
import { logError } from '../../utils/logger.util';
import { AuthRepository } from '../shared/repositories/auth.repository';
import { DoctorRepository } from '../shared/repositories/doctor.repository';
import { PatientDoctorConnectionRepository } from '../shared/repositories/patient-doctor-connection.repository';
import { DoctorWorkScheduleRepository } from '../shared/repositories/doctor-work-schedule.repository';
import { DoctorBalanceInfoRepository } from '../shared/repositories/doctor-balance-info.repository';
import { DoctorOccupationRepository } from '../shared/repositories/doctor-monthly-occupation.repository';
import {
  checkDoctorSnapshotNeedChange,
  parseDoctorSnapshot,
} from '../shared/schemas/patient-doctor-connection.schema';
import {
  DoctorUpdateCostPerMauDto,
  DoctorUpdateDto,
  DoctorUpdateStatusDto,
  DoctorWriteDto,
  DoctorBankAccountDto,
  WithdrawalRequestTransactionDto,
  WithdrawalStatusTransactionDto,
  DepositTransactionDto,
  WithdrawalStatusArgsDto,
  MonthlyWorkScheduleDto,
  MonthlyWorkScheduleUpdateDto,
  MonthlyWorkScheduleDeleteDto,
  MonthlyWorkScheduleFunction,
  DoctorUpdateCurrentBalanceDto,
} from './dtos';
import { WorkExperienceDto } from './dtos/doctor.dto';
import { IncomeTransactionSchema } from './schemas/doctor-transaction.schema';
import { generateRandomId } from '../../utils/random.util';
import { Timestamp } from 'firebase-admin/firestore';
import { StatisticsByMonth } from '../shared/schemas/sales-statistics-by-year.schema';
import { SaleStatisticsByYearRepository } from '../shared/repositories/sales-statistics-by-year.repository';
import { SystemStatisticsByMonthRepository } from '../shared/repositories/system-statistics-by-month.repository';

@Injectable()
export class DoctorService {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly authRepository: AuthRepository,
    private readonly patientDoctorConnectionRepository: PatientDoctorConnectionRepository,
    private readonly doctorWorkScheduleRepository: DoctorWorkScheduleRepository,
    private readonly doctorBalanceInfoRepository: DoctorBalanceInfoRepository,
    private readonly doctorOccupationRepository: DoctorOccupationRepository,
    private readonly saleStatisticsByYearRepository: SaleStatisticsByYearRepository,
    private readonly systemStatisticsByMonthRepository: SystemStatisticsByMonthRepository
  ) {}

  async registerDoctor(uid: string, dto: DoctorWriteDto): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(uid);

    if (existedDoctor != null) {
      throw new CustomServerError({ message: 'doctor/already-exists' });
    }

    const userRecord = await getAuth().getUser(uid);

    if (userRecord.email == null) {
      // Unexpected
      logError('Doctor register', `Doctor ${uid} does not have an email`);
      throw new CustomFirebaseError('auth/no-phone-number');
    }

    const doctorSchema = DoctorWriteDto.toSchemaCreate({
      dto,
      uid,
      email: userRecord.email,
    });

    const doctorPrivateSchema = DoctorWriteDto.toPrivateSchemaCreate({
      dto,
    });

    await Promise.all([
      this.doctorRepository.createDoctor(
        uid,
        doctorSchema,
        doctorPrivateSchema
      ),
      this.authRepository.addRoleToCustomClaims(uid, 'doctor'),
    ]);
  }

  async updateDoctor(uid: string, dto: DoctorUpdateDto): Promise<void> {
    const doctor = await this.doctorRepository.getDoctor(uid);

    if (doctor == null) {
      throw new CustomServerError({
        message: 'doctor/not-found',
      });
    }

    const fieldsToUpdate = DoctorUpdateDto.toSchemaUpdate({
      dto,
    });
    const privateFieldsToUpdate = DoctorUpdateDto.toPrivateSchemaUpdate({
      dto,
    });

    await this.doctorRepository.updateDoctor({
      doctorUid: uid,
      fieldsToUpdate,
      privateFieldsToUpdate,
    });

    // Check if need to update the doctor snapshots in this doctor's connections
    const needChangeSnapshot = checkDoctorSnapshotNeedChange(dto, doctor);

    if (needChangeSnapshot) {
      this.patientDoctorConnectionRepository.updateDoctorSnapshotForAllDoctorConnections(
        uid,
        parseDoctorSnapshot({
          uid,
          status: doctor.status,
          avatarImageUrl: dto.avatarImageUrl,
          fullName: dto.fullName,
          dob: timestampFromIsoString(dto.dob),
          gender: dto.gender,
          academicDegree: dto.academicDegree,
          specialty: dto.specialty,
          workExperienceList: dto.workExperienceList.map(
            WorkExperienceDto.toSchema
          ),
          maxTimeToBookInDay: doctor.maxTimeToBookInDay,
        })
      );
    }
  }

  async updateDoctorStatus(dto: DoctorUpdateStatusDto): Promise<void> {
    const doctor = await this.doctorRepository.getDoctor(dto.doctorUid);

    if (doctor == null) {
      throw new CustomServerError({
        message: 'doctor/not-found',
      });
    }

    await this.doctorRepository.updateDoctor({
      doctorUid: dto.doctorUid,
      fieldsToUpdate: { status: dto.status },
    });

    await this.patientDoctorConnectionRepository.updateDoctorSnapshotForAllDoctorConnections(
      doctor.uid,
      { ...parseDoctorSnapshot(doctor), status: dto.status }
    );
  }

  async updateDoctorCostPerMau(dto: DoctorUpdateCostPerMauDto): Promise<void> {
    await this.doctorRepository.updateDoctor({
      doctorUid: dto.doctorUid,
      privateFieldsToUpdate: { costPerMau: dto.costPerMau },
    });
  }

  async markConnectionAsRead(args: {
    connectionId: string;
    doctorUid: string;
  }): Promise<void> {
    const { connectionId, doctorUid } = args;

    const connection =
      await this.patientDoctorConnectionRepository.getConnectionById(
        connectionId
      );

    if (connection == null) {
      throw new CustomServerError({
        message: 'connection/not-found',
      });
    }

    if (connection.doctorUid !== doctorUid) {
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    }

    await this.patientDoctorConnectionRepository.markAsReadRecentAppointment(
      connection.id,
      'doctor'
    );
  }

  async addBankAccount(
    doctorUid: string,
    dto: DoctorBankAccountDto
  ): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }
    const bankAccountSchema = DoctorBankAccountDto.toSchemaCreate(dto);
    await this.doctorBalanceInfoRepository.addBankAccount(
      doctorUid,
      bankAccountSchema
    );
  }

  async updateBankAccount(
    doctorUid: string,
    dto: DoctorBankAccountDto,
    bankAccountId: string
  ): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }
    const schemaUpdate = DoctorBankAccountDto.toSchemaUpdate(dto);
    await this.doctorBalanceInfoRepository.updateBankAccount(
      doctorUid,
      schemaUpdate,
      bankAccountId
    );
  }

  async deleteBankAccount(uid: string, bankAccountId: string): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(uid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }
    await this.doctorBalanceInfoRepository.deleteBankAccount(
      uid,
      bankAccountId
    );
  }

  async createWithdrawalRequest(
    doctorUid: string,
    dto: WithdrawalRequestTransactionDto
  ): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }

    const withdrawalRequestSchema =
      WithdrawalRequestTransactionDto.toWithdrawalRequestSchema(dto);
    await this.doctorBalanceInfoRepository.createWithdrawalRequest(
      doctorUid,
      withdrawalRequestSchema
    );
  }

  async updateWithdrawalStatus(
    args: WithdrawalStatusArgsDto,
    dto: WithdrawalStatusTransactionDto
  ): Promise<void> {
    const { updatedByUid, doctorUid, transactionId } = args;
    const userRole = await this.authRepository.getAuthRole(updatedByUid);
    if (userRole !== 'staff') {
      if (dto.status !== 'canceledByDoctor') {
        throw new CustomServerError({ message: 'auth/unauthorized' });
      }
    }

    const existedDoctor = await this.doctorRepository.getDoctor(doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }
    await this.doctorBalanceInfoRepository.updateWithdrawalStatus(
      doctorUid,
      transactionId,
      dto.status
    );
  }

  async createDoctorDeposit(
    depositByUid: string,
    doctorUid: string,
    dto: DepositTransactionDto
  ): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }

    const depositSchema = DepositTransactionDto.toDepositTransactionSchema(
      depositByUid,
      dto
    );
    await this.doctorBalanceInfoRepository.createDoctorDeposit(
      doctorUid,
      depositSchema
    );
  }

  async createMonthlyWorkSchedule(
    dto: MonthlyWorkScheduleDto,
    doctorUid: string
  ): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }

    const schemaList = MonthlyWorkScheduleFunction.toSchemaList(dto, doctorUid);
    await this.doctorWorkScheduleRepository.createSchedule(
      schemaList,
      doctorUid
    );
  }

  async updateMonthlyWorkSchedule(
    dto: MonthlyWorkScheduleUpdateDto,
    doctorUid: string,
    scheduleId: string
  ): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }

    await this.doctorWorkScheduleRepository.updateSchedule(
      dto,
      doctorUid,
      scheduleId
    );
  }

  async deleteMonthlyWorkSchedule(
    dto: MonthlyWorkScheduleDeleteDto,
    doctorUid: string,
    scheduleId: string
  ): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }

    await this.doctorWorkScheduleRepository.deleteSchedule(
      dto,
      doctorUid,
      scheduleId
    );
  }

  async summaryMonthlyIncome(): Promise<void> {
    const occupationList =
      await this.doctorOccupationRepository.getDoctorOccupationThisMonth();
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const monthId = formatDateToMonthId(yesterday);
    let overall: StatisticsByMonth = {
      monthId,
      appointmentsCount: 0,
      appointmentsTotalFee: 0,
      mauCount: 0,
      mauTotalCost: 0,
      doctorsTotalBalance: 0,
      doctorsTotalWithdrawal: 0,
    };
    await Promise.all(
      occupationList.map(async (occupation) => {
        let totalAmount = 0;
        occupation.occupiedSlotList.map((slot) => {
          totalAmount += slot.appointmentSnapshot.finalFee;
        });
        const currentBalance =
          await this.doctorBalanceInfoRepository.getCurrentBalance(
            occupation.doctorUid
          );
        const incomeSchema: IncomeTransactionSchema = {
          id: generateRandomId(),
          createdAt: Timestamp.now(),
          balanceAfterTransaction: currentBalance + totalAmount,
          type: 'income',
          incomeTransaction: {
            incomeAmount: totalAmount,
            monthId,
          },
        };
        const [promiseVoid, args] = await Promise.all([
          this.doctorBalanceInfoRepository.createIncomeTransaction(
            occupation.doctorUid,
            incomeSchema
          ),
          this.doctorBalanceInfoRepository.scheduleMonthlyIncome(
            occupation.doctorUid
          ),
        ]);

        // add to overall stat
        overall.appointmentsCount += occupation.occupiedSlotList.length;
        overall.appointmentsTotalFee += totalAmount;
        overall.mauCount += args?.mauCount ?? 0;
        overall.mauTotalCost += args?.mauTotalCost ?? 0;
        overall.doctorsTotalBalance += incomeSchema.balanceAfterTransaction;
      })
    );
    await Promise.all([
      this.saleStatisticsByYearRepository.createOrUpdate(overall),
      this.systemStatisticsByMonthRepository.updateMonthly(
        overall.appointmentsTotalFee - overall.mauTotalCost,
        overall.appointmentsTotalFee
      ),
    ]);
  }

  async updateCurrentBalance(
    dto: DoctorUpdateCurrentBalanceDto
  ): Promise<void> {
    const existedDoctor = await this.doctorRepository.getDoctor(dto.doctorUid);

    if (!existedDoctor) {
      throw new CustomServerError({ message: 'doctor/not-found' });
    }
    await this.doctorBalanceInfoRepository.updateCurrentBalance(
      dto.doctorUid,
      dto.currentBalance
    );
  }
}
