import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DoctorUpdateCostPerMauDto {
  @IsString()
  @IsNotEmpty()
  doctorUid: string;

  @IsNumber()
  @IsOptional()
  costPerMau: number | null;
}
