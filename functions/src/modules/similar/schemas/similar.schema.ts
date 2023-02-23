import { Timestamp } from 'firebase-admin/firestore';
import { Gender, PatientStatus } from '../../../constants/enum.constant';

interface DataSchema {
  name: string;
  url: string;
  size: number;
  status: PatientStatus;
  sharedToSystem: boolean;
}

interface OrganizationSnapshotSchema {
  uid: string;
  name: string;
}

export interface SimilarSchema {
  uid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userUid: string;
  organizationSnapshot: OrganizationSnapshotSchema | null;
  dataTestUrl: string;
  dataTemplateUrl: string;
  status: string;
  matchPercent: number;
  type: string;
  language: string[];
}
