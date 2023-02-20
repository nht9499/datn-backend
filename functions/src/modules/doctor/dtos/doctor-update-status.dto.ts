import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import {
  DoctorStatus,
  doctorStatusList,
} from '../../../constants/enum.constant';

export class DoctorUpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  doctorUid: string;

  @IsIn(doctorStatusList)
  status: DoctorStatus;
}
