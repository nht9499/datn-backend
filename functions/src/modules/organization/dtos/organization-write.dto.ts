import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { Timestamp } from 'firebase-admin/firestore';
import { convertFullNameToKeywordList } from '../../../utils/string.util';
import { OrganizationSchema } from '../schemas/organization.schema';
import { v4 as uuidv4 } from 'uuid';

export class OrganizationWriteDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  static toSchemaCreate(args: {
    userUid: string;
    dto: OrganizationWriteDto;
  }): OrganizationSchema {
    const { userUid, dto } = args;

    const nowTimestamp = Timestamp.now();

    return {
      uid: uuidv4(),
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
      status: 'activated',
      fullName: dto.fullName,
      email: dto.email,
      searchableKeywordList: dto.fullName
        ? convertFullNameToKeywordList(dto.fullName)
        : [],
      data: [],
      memberUidList: [userUid],
      adminUidList: [userUid],
    };
  }
}
