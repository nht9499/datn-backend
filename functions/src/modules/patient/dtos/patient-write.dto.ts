import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf
} from 'class-validator';
import { Timestamp } from 'firebase-admin/firestore';
import { Gender, genderList } from '../../../constants/enum.constant';
import { timestampFromIsoString } from '../../../utils/date.util';
import { convertFullNameToKeywordList } from '../../../utils/string.util';
import { PatientSchema } from '../schemas/patient.schema';

export class PatientWriteDto {
  @IsUrl({
    require_host: false
  })
  avatarImageUrl: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsISO8601()
  dob: string;

  @IsIn(genderList)
  gender: Gender;

  @IsOptional()
  @IsEmail()
  @ValidateIf((object, value) => value !== null)
  email: string | null;

  static toSchemaCreate(args: {
    uid: string;
    phoneNumber: string;
    dto: PatientWriteDto;
  }): PatientSchema {
    const { uid, phoneNumber, dto } = args;

    const nowTimestamp = Timestamp.now();

    return {
      uid,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
      status: 'activated',
      avatarImageUrl: dto.avatarImageUrl,
      phoneNumber,
      fullName: dto.fullName,
      dob: timestampFromIsoString(dto.dob),
      gender: dto.gender,
      email: dto.email,
      searchableKeywordList: convertFullNameToKeywordList(dto.fullName),
      sharingToDoctorUidList: []
    };
  }

  static toSchemaUpdate(dto: PatientWriteDto): Partial<PatientSchema> {
    const nowTimestamp = Timestamp.now();

    return {
      updatedAt: nowTimestamp,
      fullName: dto.fullName,
      dob: timestampFromIsoString(dto.dob),
      gender: dto.gender,
      email: dto.email,
      searchableKeywordList: convertFullNameToKeywordList(dto.fullName)
    };
  }
}
