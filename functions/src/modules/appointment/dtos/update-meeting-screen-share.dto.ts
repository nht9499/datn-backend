import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { MeetingScreenShareDataSchema } from '../schema/meeting.schema';

export class DeviceSizeDto {
  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class RectDto {
  @IsNumber()
  left: number;

  @IsNumber()
  top: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class UpdateMeetingScreenShareDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ScreenShareDataDto)
  screenShareData: ScreenShareDataDto | null;
}

export class ScreenShareDataDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeviceSizeDto)
  deviceSize: DeviceSizeDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RectDto)
  shareRegionRect: RectDto;

  static toSchema(dto: ScreenShareDataDto): MeetingScreenShareDataSchema {
    return {
      deviceSize: {
        width: dto.deviceSize.width,
        height: dto.deviceSize.height,
      },
      shareRegionRect: {
        left: dto.shareRegionRect.left,
        top: dto.shareRegionRect.top,
        width: dto.shareRegionRect.width,
        height: dto.shareRegionRect.height,
      },
    };
  }
}
