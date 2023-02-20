import { IsNumber } from 'class-validator';
import { SettingsSchema } from '../schemas/settings.schema';

export class SettingsWriteDto {
  @IsNumber()
  doctorCostPerMau: number;

  @IsNumber()
  doctorMinBalance: number;

  @IsNumber()
  doctorMaxMonthlyWithdrawal: number;
  static toSchema(dto: SettingsWriteDto): SettingsSchema {
    return {
      id: 'settings',
      doctorCostPerMau: dto.doctorCostPerMau,
      doctorMinBalance: dto.doctorMinBalance,
      doctorMaxMonthlyWithdrawal: dto.doctorMaxMonthlyWithdrawal
    };
  }
}
