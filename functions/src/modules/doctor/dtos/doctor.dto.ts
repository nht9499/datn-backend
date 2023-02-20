import { DoctorStatus, Gender } from '../../../constants/enum.constant';
import { isoStringFromTimestamp } from '../../../utils/date.util';
import { DoctorSchema, WorkExperienceSchema } from '../schemas/doctor.schema';

export class DoctorDto {
  uid: string;
  createdAt: string;
  updatedAt: string;
  status: DoctorStatus;
  avatarImageUrl: string;
  email: string;
  fullName: string;
  dob: string;
  gender: Gender;
  phoneNumber: string;
  academicDegree: string;
  specialty: string;
  workExperienceList: WorkExperienceDto[];
  maxTimeToBookInDay: string;

  static fromSchema(schema: DoctorSchema): DoctorDto {
    return {
      uid: schema.uid,
      createdAt: isoStringFromTimestamp(schema.createdAt),
      updatedAt: isoStringFromTimestamp(schema.updatedAt),
      status: schema.status,
      avatarImageUrl: schema.avatarImageUrl,
      email: schema.email,
      fullName: schema.fullName,
      dob: isoStringFromTimestamp(schema.dob),
      gender: schema.gender,
      phoneNumber: schema.phoneNumber,
      academicDegree: schema.academicDegree,
      specialty: schema.specialty,
      workExperienceList: schema.workExperienceList.map(
        WorkExperienceDto.toSchema
      ),
      maxTimeToBookInDay: schema.maxTimeToBookInDay,
    };
  }
}

export class WorkExperienceDto {
  workplace: string;
  title: string;

  static toSchema(dto: WorkExperienceDto): WorkExperienceSchema {
    return {
      workplace: dto.workplace,
      title: dto.title,
    };
  }
}
