import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DoctorUpdateCurrentBalanceDto {
  @IsString()
  @IsNotEmpty()
  doctorUid: string;

  @IsNumber()
  @IsOptional()
  currentBalance: number;
}
