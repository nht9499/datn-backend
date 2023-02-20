import { IsIn } from 'class-validator';
import {
  PatientStatus,
  patientStatusList,
} from '../../../constants/enum.constant';

export class PatientUpdateStatusDto {
  @IsIn(patientStatusList)
  status: PatientStatus;
}
