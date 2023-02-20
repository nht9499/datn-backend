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
import { Gender, genderList } from '../../../constants/enum.constant';
import { timestampFromIsoString } from '../../../utils/date.util';
import { convertFullNameToKeywordList } from '../../../utils/string.util';
import { UserSchema } from '../schemas/user.schema';

export class UserWriteDto {
  @IsOptional()
  @IsUrl({
    require_host: false,
  })
  avatarImageUrl?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @IsOptional()
  @IsISO8601()
  dob?: string;

  @IsOptional()
  @IsIn(genderList)
  gender?: Gender;

  @IsOptional()
  @IsEmail()
  @ValidateIf((object, value) => value !== null)
  email?: string | null;

  static toSchemaCreate(args: { uid: string; dto: UserWriteDto }): UserSchema {
    const { uid, dto } = args;

    const nowTimestamp = Timestamp.now();

    return {
      uid,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
      status: 'activated',
      avatarImageUrl: dto.avatarImageUrl,
      fullName: dto.fullName,
      dob: dto.dob ? timestampFromIsoString(dto.dob) : null,
      gender: dto.gender,
      email: dto.email,
      searchableKeywordList: dto.fullName
        ? convertFullNameToKeywordList(dto.fullName)
        : [],
      data: [],
      organizationList: [],
    };
  }
}
