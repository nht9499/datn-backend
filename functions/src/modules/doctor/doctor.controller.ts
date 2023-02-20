import {
  Body,
  Controller,
  Patch,
  Post,
  UseFilters,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import {
  AppFirebaseUser,
  AppFirebaseUserDto,
  AppFirebaseUserWithoutRoleDto,
} from '../../decorators/app-firebase-user.decorator';
import { CustomErrorFilter } from '../../filters/custom-exception.filter';
import { AuthRoleGuard } from '../../guards/auth-role.guard';
import { AuthGuard } from '../../guards/auth.guard';
import { DoctorService } from './doctor.service';
import {
  DoctorWriteDto,
  DoctorUpdateDto,
  DoctorUpdateStatusDto,
  DoctorUpdateCostPerMauDto,
  DoctorBankAccountDto,
  WithdrawalRequestTransactionDto,
  WithdrawalStatusTransactionDto,
  DepositTransactionDto,
  MonthlyWorkScheduleDto,
  MonthlyWorkScheduleUpdateDto,
  MonthlyWorkScheduleDeleteDto,
  DoctorUpdateCurrentBalanceDto,
} from './dtos';
@Controller('doctors')
@UseFilters(CustomErrorFilter)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('/register')
  async registerProfile(
    @AppFirebaseUser({ useRole: false })
    user: AppFirebaseUserWithoutRoleDto,
    @Body() dto: DoctorWriteDto
  ): Promise<void> {
    await this.doctorService.registerDoctor(user.uid, dto);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch()
  async updateProfile(
    @AppFirebaseUser()
    user: AppFirebaseUserDto,
    @Body() dto: DoctorUpdateDto
  ): Promise<void> {
    await this.doctorService.updateDoctor(user.uid, dto);
  }

  @UseGuards(AuthRoleGuard('staff'))
  @Patch('staffUpdateProfile/:doctorUid')
  async staffUpdateProfile(
    @Param('doctorUid') doctorUid: string,
    @Body() dto: DoctorUpdateDto
  ): Promise<void> {
    await this.doctorService.updateDoctor(doctorUid, dto);
  }

  @UseGuards(AuthRoleGuard('staff'))
  @Patch('/update-status')
  async updateDoctorStatus(
    @Body()
    dto: DoctorUpdateStatusDto
  ): Promise<void> {
    await this.doctorService.updateDoctorStatus(dto);
  }

  @UseGuards(AuthRoleGuard('staff'))
  @Patch('/update-cost-per-mau')
  async updateDoctorCostPerMau(
    @Body()
    dto: DoctorUpdateCostPerMauDto
  ): Promise<void> {
    await this.doctorService.updateDoctorCostPerMau(dto);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Post('/bank-account')
  async addDoctorBankAccount(
    @AppFirebaseUser()
    user: AppFirebaseUserDto,
    @Body()
    dto: DoctorBankAccountDto
  ): Promise<void> {
    await this.doctorService.addBankAccount(user.uid, dto);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/bank-account/:bankAccountId')
  async updateDoctorBankAccount(
    @AppFirebaseUser()
    user: AppFirebaseUserDto,
    @Param('bankAccountId') bankAccountId: string,
    @Body()
    dto: DoctorBankAccountDto
  ): Promise<void> {
    await this.doctorService.updateBankAccount(user.uid, dto, bankAccountId);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Delete('/bank-account/:bankAccountId')
  async deleteDoctorBankAccount(
    @AppFirebaseUser()
    user: AppFirebaseUserDto,
    @Param('bankAccountId') bankAccountId: string
  ): Promise<void> {
    await this.doctorService.deleteBankAccount(user.uid, bankAccountId);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Post('/withdrawal')
  async withdrawalRequest(
    @AppFirebaseUser()
    user: AppFirebaseUserDto,
    @Body()
    dto: WithdrawalRequestTransactionDto
  ): Promise<void> {
    await this.doctorService.createWithdrawalRequest(user.uid, dto);
  }

  @UseGuards(AuthRoleGuard('staff'))
  @Patch('/:doctorUid/withdrawal/:transactionId')
  async updatewWithdrawalStatus(
    @AppFirebaseUser()
    user: AppFirebaseUserDto,
    @Param('doctorUid') doctorUid: string,
    @Param('transactionId') transactionId: string,
    @Body()
    dto: WithdrawalStatusTransactionDto
  ): Promise<void> {
    const args = {
      updatedByUid: user.uid,
      doctorUid,
      transactionId,
    };
    await this.doctorService.updateWithdrawalStatus(args, dto);
  }

  @UseGuards(AuthRoleGuard('staff'))
  @Post('/:doctorUid/deposit')
  async createDoctorDeposit(
    @AppFirebaseUser()
    user: AppFirebaseUserDto,
    @Param('doctorUid') doctorUid: string,
    @Body()
    dto: DepositTransactionDto
  ): Promise<void> {
    await this.doctorService.createDoctorDeposit(user.uid, doctorUid, dto);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Post('/work-schedules')
  async createMonthlyWorkSchedule(
    @AppFirebaseUser()
    doctor: AppFirebaseUserDto,
    @Body()
    dto: MonthlyWorkScheduleDto
  ): Promise<void> {
    await this.doctorService.createMonthlyWorkSchedule(dto, doctor.uid);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/work-schedules/:scheduleId')
  async updateMonthlyWorkSchedule(
    @AppFirebaseUser()
    doctor: AppFirebaseUserDto,
    @Body()
    dto: MonthlyWorkScheduleUpdateDto,
    @Param('scheduleId') scheduleId: string
  ): Promise<void> {
    await this.doctorService.updateMonthlyWorkSchedule(
      dto,
      doctor.uid,
      scheduleId
    );
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Delete('/work-schedules/:scheduleId')
  async deleteMonthlyWorkSchedule(
    @AppFirebaseUser()
    doctor: AppFirebaseUserDto,
    @Body()
    dto: MonthlyWorkScheduleDeleteDto,
    @Param('scheduleId') scheduleId: string
  ): Promise<void> {
    await this.doctorService.deleteMonthlyWorkSchedule(
      dto,
      doctor.uid,
      scheduleId
    );
  }

  @UseGuards(AuthRoleGuard('staff'))
  @Patch('update-current-balance')
  async updateCurrentBalance(
    @Body() dto: DoctorUpdateCurrentBalanceDto
  ): Promise<void> {
    await this.doctorService.updateCurrentBalance(dto);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/mark-connection-as-read/:connectionId')
  async markConnectionAsRead(
    @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('connectionId') connectionId: string
  ): Promise<void> {
    await this.doctorService.markConnectionAsRead({
      connectionId,
      doctorUid: user.uid,
    });
  }
}
