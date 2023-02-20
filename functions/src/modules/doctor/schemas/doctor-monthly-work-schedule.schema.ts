import { ScheduleRecurring } from '../../../constants/enum.constant';

export interface MonthlyWorkScheduleSchema {
  id: string;
  doctorUid: string;
  monthId: string;
  sharingToPatientUidList: string[];
  workSlotList: WorkSlot[];
}

export interface WorkSlot {
  id: string;
  recurringId: string | null;
  recurringType: ScheduleRecurring | null;
  timeZone: string;
  dateOnly: string;
  timeRange: TimeRange;
}

interface TimeRange {
  startTime: string;
  endTime: string;
}
