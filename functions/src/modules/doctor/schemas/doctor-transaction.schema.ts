import { TransactionStatus } from '../../../constants/enum.constant';
import { BankAccountSchema } from './doctor-balance-info.schema';
import { Timestamp } from 'firebase-admin/firestore';
import { TransactionType } from '../../../constants/enum.constant';
import { OmitStrict } from '../../../utils/type.util';

interface BaseTransactionSchema {
  id: string;
  createdAt: Timestamp;
  balanceAfterTransaction: number;
  type: TransactionType;
}

interface DepositTransaction {
  depositAmount: number;
  depositByUid: string;
}
export interface DepositTransactionSchema extends BaseTransactionSchema {
  type: 'deposit';
  depositTransaction: DepositTransaction;
}

interface WithDrawalTransaction {
  withdrawalAmount: number;
  status: TransactionStatus;
  bankSnapshot: OmitStrict<BankAccountSchema, 'id'>;
}
export interface WithdrawalTransactionSchema extends BaseTransactionSchema {
  type: 'withdrawal';
  withdrawalTransaction: WithDrawalTransaction;
}

interface IncomeTransaction {
  incomeAmount: number;
  monthId: string;
}
export interface IncomeTransactionSchema extends BaseTransactionSchema {
  type: 'income';
  incomeTransaction: IncomeTransaction;
}

export type TransactionSchema =
  | DepositTransactionSchema
  | WithdrawalTransactionSchema
  | IncomeTransactionSchema;
