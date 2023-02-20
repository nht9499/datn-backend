import { Timestamp } from 'firebase-admin/firestore';

export interface PrivateNoteSchema {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  doctorUid: string;
  note: string;
}
