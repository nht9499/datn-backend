import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateNested,
  Validate,
  IsOptional,
} from 'class-validator';
import { Timestamp } from 'firebase-admin/firestore';
import { Gender, genderList } from '../../../constants/enum.constant';
import { timestampFromIsoString } from '../../../utils/date.util';
import { convertFullNameToKeywordList } from '../../../utils/string.util';
import { DoctorPrivateDataSchema } from '../schemas/doctor-private-data.schema';
import { DoctorSchema, WorkExperienceSchema } from '../schemas/doctor.schema';
import { CustomTimeString } from '../../shared/dtos/custom-date.dto';

export class DoctorWriteDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsISO8601()
  dob: string;

  @IsIn(genderList)
  gender: Gender;

  @IsString()
  phoneNumber: string;

  @IsUrl({
    require_host: false,
  })
  avatarImageUrl: string;

  @IsString()
  academicDegree: string;

  @IsString()
  specialty: string;

  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  workExperienceList: WorkExperienceDto[];

  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  personalIdCardImageUrlList: string[];

  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  practisingCertificateImageUrlList: string[];

  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  otherCertificateImageUrlList: string[];

  @IsOptional()
  @Validate(CustomTimeString, {
    message: 'Invalid time',
  })
  maxTimeToBookInDay?: string;

  static toSchemaCreate(args: {
    dto: DoctorWriteDto;
    uid: string;
    email: string;
  }): DoctorSchema {
    const { dto, uid, email } = args;

    const nowTimestamp = Timestamp.now();
    return {
      uid,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
      status: 'inReview',
      avatarImageUrl: dto.avatarImageUrl,
      email,
      fullName: dto.fullName,
      dob: timestampFromIsoString(dto.dob),
      gender: dto.gender,
      phoneNumber: dto.phoneNumber,
      academicDegree: dto.academicDegree,
      specialty: dto.specialty,
      workExperienceList: dto.workExperienceList.map((experience) =>
        WorkExperienceDto.toSchema(experience)
      ),
      searchableKeywordList: convertFullNameToKeywordList(dto.fullName),
      sharingToPatientUidList: [],
      maxTimeToBookInDay: dto.maxTimeToBookInDay ?? '24:00',
    };
  }

  static toPrivateSchemaCreate(args: {
    dto: DoctorWriteDto;
  }): DoctorPrivateDataSchema {
    const { dto } = args;

    return {
      personalIdCardImageUrlList: dto.personalIdCardImageUrlList,
      practisingCertificateImageUrlList: dto.practisingCertificateImageUrlList,
      otherCertificateImageUrlList: dto.otherCertificateImageUrlList,
      costPerMau: null,
      lastWithdrawalSnapshot: null,
    };
  }
}

export class DoctorUpdateDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsISO8601()
  dob: string;

  @IsIn(genderList)
  gender: Gender;

  @IsString()
  phoneNumber: string;

  @IsUrl()
  avatarImageUrl: string;

  @IsString()
  academicDegree: string;

  @IsString()
  specialty: string;

  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  workExperienceList: WorkExperienceDto[];

  @IsOptional()
  @Validate(CustomTimeString, {
    message: 'Invalid time',
  })
  maxTimeToBookInDay?: string;

  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  @IsOptional()
  personalIdCardImageUrlList: string[];

  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  @IsOptional()
  practisingCertificateImageUrlList: string[];

  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  @IsOptional()
  otherCertificateImageUrlList: string[];

  static toSchemaUpdate(args: { dto: DoctorUpdateDto }): Partial<DoctorSchema> {
    const { dto } = args;

    const nowTimestamp = Timestamp.now();

    return {
      updatedAt: nowTimestamp,
      avatarImageUrl: dto.avatarImageUrl,
      fullName: dto.fullName,
      dob: timestampFromIsoString(dto.dob),
      gender: dto.gender,
      phoneNumber: dto.phoneNumber,
      academicDegree: dto.academicDegree,
      specialty: dto.specialty,
      workExperienceList: dto.workExperienceList.map((experience) =>
        WorkExperienceDto.toSchema(experience)
      ),
      searchableKeywordList: convertFullNameToKeywordList(dto.fullName),
      maxTimeToBookInDay: dto.maxTimeToBookInDay ?? '24:00',
    };
  }
  static toPrivateSchemaUpdate(args: {
    dto: Partial<DoctorWriteDto>;
  }): Partial<DoctorPrivateDataSchema> {
    const { dto } = args;

    return {
      personalIdCardImageUrlList: dto.personalIdCardImageUrlList,
      practisingCertificateImageUrlList: dto.practisingCertificateImageUrlList,
      otherCertificateImageUrlList: dto.otherCertificateImageUrlList,
    };
  }
}

class WorkExperienceDto {
  @IsString()
  workplace: string;

  @IsString()
  title: string;

  static toSchema(dto: WorkExperienceDto): WorkExperienceSchema {
    return {
      title: dto.title,
      workplace: dto.workplace,
    };
  }
}
