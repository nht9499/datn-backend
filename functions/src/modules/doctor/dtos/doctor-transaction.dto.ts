import {
  IsNumber,
  ValidateNested,
  IsObject,
  IsIn,
  IsString,
} from 'class-validator';
import {
  TransactionSchema,
  DepositTransactionSchema,
  WithdrawalTransactionSchema,
} from '../schemas/doctor-transaction.schema';
import { Timestamp } from 'firebase-admin/firestore';
import { DoctorBankAccountDto } from './doctor-bank-account.dto';
import {
  TransactionStatus,
  transactionStatusList,
} from '../../../constants/enum.constant';
import { generateRandomId } from '../../../utils/random.util';
import { OmitStrict } from '../../../utils/type.util';
import { Type } from 'class-transformer';

export class DepositTransactionDto {
  @IsNumber()
  depositAmount: number;

  static toDepositTransactionSchema(
    depositByUid: string,
    dto: DepositTransactionDto
  ): OmitStrict<DepositTransactionSchema, 'balanceAfterTransaction'> {
    const nowTimestamp = Timestamp.now();
    return {
      id: generateRandomId(),
      createdAt: nowTimestamp,
      type: 'deposit',
      depositTransaction: {
        depositAmount: dto.depositAmount,
        depositByUid: depositByUid,
      },
    };
  }
}

export class WithdrawalRequestTransactionDto {
  @IsNumber()
  withdrawalAmount: number;

  @ValidateNested()
  @Type(() => DoctorBankAccountDto)
  bankSnapshot: DoctorBankAccountDto;

  static toWithdrawalRequestSchema(
    dto: WithdrawalRequestTransactionDto
  ): OmitStrict<WithdrawalTransactionSchema, 'balanceAfterTransaction'> {
    const nowTimestamp = Timestamp.now();
    return {
      id: generateRandomId(),
      createdAt: nowTimestamp,
      type: 'withdrawal',
      withdrawalTransaction: {
        withdrawalAmount: dto.withdrawalAmount,
        status: 'waiting',
        bankSnapshot: dto.bankSnapshot,
      },
    };
  }
}

export class WithdrawalStatusTransactionDto {
  @IsIn(transactionStatusList)
  status: TransactionStatus;
}

export class WithdrawalStatusArgsDto {
  @IsString()
  updatedByUid: string;

  @IsString()
  doctorUid: string;

  @IsString()
  transactionId: string;
}
