import { IsString } from 'class-validator';
import { BankAccountSchema } from '../schemas/doctor-balance-info.schema';
import { generateRandomId } from '../../../utils/random.util';
import { OmitStrict } from '../../../utils/type.util';

export class DoctorBankAccountDto {
  @IsString()
  bankName: string;

  @IsString()
  bankAccountNumber: string;

  @IsString()
  bankAccountName: string;

  static toSchemaCreate(dto: DoctorBankAccountDto): BankAccountSchema {
    return {
      id: generateRandomId(),
      bankName: dto.bankName,
      bankAccountNumber: dto.bankAccountNumber,
      bankAccountName: dto.bankAccountName
    };
  }

  static toSchemaUpdate(
    dto: DoctorBankAccountDto
  ): OmitStrict<BankAccountSchema, 'id'> {
    return {
      bankName: dto.bankName,
      bankAccountNumber: dto.bankAccountNumber,
      bankAccountName: dto.bankAccountName
    };
  }
}
