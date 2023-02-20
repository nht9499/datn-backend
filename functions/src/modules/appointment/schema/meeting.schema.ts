import { Timestamp } from 'firebase-admin/firestore';
import { UserState } from '../../../constants/enum.constant';

export interface MeetingSchema {
  id: string;
  patientState: UserState;
  doctorState: UserState;
  extendedDurationInMinutes: number;
  endedAt: Timestamp | null;

  screenShareData: MeetingScreenShareDataSchema | null;
}

export interface MeetingScreenShareDataSchema {
  deviceSize: DeviceSizeSchema;
  shareRegionRect: RectSchema;
}

export interface DeviceSizeSchema {
  width: number;
  height: number;
}

export interface RectSchema {
  left: number;
  top: number;
  width: number;
  height: number;
}
