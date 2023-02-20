import {
  ValidateNested,
  IsIn,
  Validate,
  IsOptional,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import {
  MonthlyWorkScheduleSchema,
  WorkSlot,
} from '../schemas/doctor-monthly-work-schedule.schema';
import {
  ScheduleRecurring,
  scheduleRecurringList,
} from '../../../constants/enum.constant';
import {
  formatDateToMonthId,
  formatDateToString,
} from '../../../utils/date.util';
import { generateNanoid } from '../../../utils/random.util';
import { OmitStrict } from '../../../utils/type.util';
import {
  CustomMonthString,
  CustomDateString,
  CustomTimeString,
} from '../../shared/dtos/custom-date.dto';
import { Type } from 'class-transformer';
import { getUserMonthUid } from '../../../utils/string.util';

class TimeRange {
  @Validate(CustomTimeString, {
    message: 'Invalid time',
  })
  startTime: string;

  @Validate(CustomTimeString, {
    message: 'Invalid time',
  })
  endTime: string;
}

export class MonthlyWorkScheduleDto {
  @IsOptional()
  @IsIn(scheduleRecurringList)
  @ValidateIf((object, value) => value !== null)
  recurring?: ScheduleRecurring | null;

  @Validate(CustomDateString, {
    message: 'Invalid date',
  })
  dateOnly: string;

  @ValidateNested()
  @Type(() => TimeRange)
  timeRange: TimeRange;
}

export class MonthlyWorkScheduleUpdateDto {
  @Validate(CustomMonthString, {
    message: 'Invalid month',
  })
  monthId: string;

  @ValidateNested()
  @Type(() => TimeRange)
  timeRange: TimeRange;

  @IsBoolean()
  updateRelated: Boolean;
}

export class MonthlyWorkScheduleDeleteDto {
  @Validate(CustomMonthString, {
    message: 'Invalid month',
  })
  monthId: string;

  @IsBoolean()
  updateRelated: Boolean;
}

export class MonthlyWorkScheduleFunction {
  static toSchemaList(
    dto: MonthlyWorkScheduleDto,
    doctorUid: string
  ): OmitStrict<MonthlyWorkScheduleSchema, 'sharingToPatientUidList'>[] {
    const schemaList: OmitStrict<
      MonthlyWorkScheduleSchema,
      'sharingToPatientUidList'
    >[] = [];
    // copy dto.dateOnly
    let dateOnly = dto.dateOnly.slice();
    const monthId = formatDateToMonthId(new Date(dateOnly));
    if (!dto.recurring) {
      schemaList.push({
        id: getUserMonthUid(doctorUid, new Date(dateOnly)),
        doctorUid,
        monthId,
        workSlotList: [
          {
            id: generateNanoid(),
            recurringId: null,
            recurringType: null,
            timeZone: 'Asia/Bangkok',
            dateOnly: formatDateToString(new Date(dto.dateOnly)),
            timeRange: dto.timeRange,
          },
        ],
      });
    } else {
      const recurringId = generateNanoid();
      let dayRequireList = [new Date(dto.dateOnly).getDay()];
      if (dto.recurring === 'everyWeekday') {
        dayRequireList = [0, 1, 2, 3, 4];
      } else if (dto.recurring === 'everyWeekend') {
        dayRequireList = [5, 6];
      } else if (dto.recurring === 'daily') {
        dayRequireList = [0, 1, 2, 3, 4, 5, 6];
      }
      // get 24 schema from now to 2 year later
      for (let i = 0; i < 24; i++) {
        const monthId = formatDateToMonthId(new Date(dateOnly));
        let monthDate = new Date(monthId);
        if (i === 0) {
          monthDate = new Date(dateOnly);
        }
        const workSlotList = this.getAllSlotInMonth(dto, {
          dayRequireList,
          monthDate,
          recurringId,
        });
        schemaList.push({
          id: getUserMonthUid(doctorUid, monthDate),
          doctorUid,
          monthId,
          workSlotList,
        });
        // add 1 month
        monthDate.setMonth(monthDate.getMonth() + 1);
        dateOnly = formatDateToString(monthDate);
      }
    }
    return schemaList;
  }

  static getAllSlotInMonth(
    dto: MonthlyWorkScheduleDto,
    args: {
      dayRequireList: number[];
      monthDate: Date;
      recurringId: string | null;
    }
  ): WorkSlot[] {
    const { dayRequireList, monthDate, recurringId } = args;
    const days: string[] = [];

    let d = monthDate;
    dayRequireList.map((dayRequire) => {
      // Get the first Day required in month
      let dmap = new Date(d);
      while (dmap.getDay() !== dayRequire) {
        dmap.setDate(dmap.getDate() + 1);
      }
      // Get all the other Days in month
      while (dmap.getMonth() === monthDate.getMonth()) {
        const pushDate = new Date(dmap.getTime());
        days.push(formatDateToString(pushDate));
        dmap.setDate(dmap.getDate() + 7);
      }
    });

    return days.map((day) => {
      return {
        id: generateNanoid(),
        recurringId,
        recurringType: dto.recurring ?? null,
        timeZone: 'Asia/Bangkok',
        dateOnly: day,
        timeRange: dto.timeRange,
      };
    });
  }
}
