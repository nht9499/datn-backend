import { Injectable } from '@nestjs/common';
import {
  getFirestore,
  DocumentReference,
  CollectionReference,
  FieldValue,
} from 'firebase-admin/firestore';
import { COLLECTION_DOCTOR_SCHEDULE } from '../../../constants/firestore.constant';
import { CustomServerError } from '../../../exceptions/custom-server.exception';
import { OmitStrict } from '../../../utils/type.util';
import { formatDateToMonthId } from '../../../utils/date.util';
import {
  MonthlyWorkScheduleSchema,
  WorkSlot,
} from '../../doctor/schemas/doctor-monthly-work-schedule.schema';
import {
  MonthlyWorkScheduleDeleteDto,
  MonthlyWorkScheduleUpdateDto,
} from '../../doctor/dtos';
import { DoctorRepository } from './doctor.repository';

@Injectable()
export class DoctorWorkScheduleRepository {
  constructor(private readonly doctorRepository: DoctorRepository) {}
  private getDoctorScheduleColRef(): CollectionReference {
    return getFirestore().collection(COLLECTION_DOCTOR_SCHEDULE.name);
  }
  private getDoctorScheduleDocRef(
    doctorUid: string,
    monthId: string
  ): DocumentReference {
    const docId = doctorUid + '---' + monthId;
    return getFirestore()
      .collection(COLLECTION_DOCTOR_SCHEDULE.name)
      .doc(docId);
  }
  async createSchedule(
    schemaList: OmitStrict<
      MonthlyWorkScheduleSchema,
      'sharingToPatientUidList'
    >[],
    doctorUid: string
  ): Promise<void> {
    const doctor = await this.doctorRepository.getDoctor(doctorUid);
    if (!doctor) {
      throw new CustomServerError({
        message: 'doctor/not-found',
      });
    }
    await Promise.all(
      schemaList.map((schema) => {
        getFirestore().runTransaction(async (t) => {
          const scheduleDocRef = this.getDoctorScheduleDocRef(
            doctorUid,
            schema.monthId
          );
          const scheduleSnapshot = await t.get(scheduleDocRef);
          const scheduleData =
            scheduleSnapshot.data() as MonthlyWorkScheduleSchema;
          if (!scheduleData) {
            // create new document
            const scheduleSchema: MonthlyWorkScheduleSchema = {
              ...schema,
              sharingToPatientUidList: doctor.sharingToPatientUidList,
            };
            t.create(scheduleDocRef, scheduleSchema);
          } else {
            // update existed document
            schema.workSlotList.map((workSlot) => {
              scheduleData.workSlotList.push(workSlot);
            });
            t.update(scheduleDocRef, scheduleData);
          }
        });
      })
    );
  }

  async updateSchedule(
    dto: MonthlyWorkScheduleUpdateDto,
    doctorUid: string,
    scheduleId: string
  ): Promise<void> {
    const { monthId, timeRange, updateRelated } = dto;
    await getFirestore().runTransaction(async (t) => {
      const scheduleDocRef = this.getDoctorScheduleDocRef(doctorUid, monthId);
      const scheduleSnapshot = await t.get(scheduleDocRef);
      const scheduleData = scheduleSnapshot.data() as MonthlyWorkScheduleSchema;
      if (!scheduleData)
        throw new CustomServerError({
          message: 'doctor/not-found-schedule',
        });
      const foundIndex = scheduleData.workSlotList.findIndex(
        (workSlot) => workSlot.id == scheduleId
      );
      if (foundIndex === -1)
        throw new CustomServerError({
          message: 'doctor/not-found-schedule',
        });
      scheduleData.workSlotList[foundIndex].timeRange = timeRange;

      if (updateRelated) {
        const scheduleColRef = this.getDoctorScheduleColRef();
        const year = monthId.substring(0, 4);
        const yearReplace = Number(year) - 2;
        const monthQuery = yearReplace + monthId.substring(4);
        // TODO: add field recurringIdList in document to replace this query
        const snapshot = await scheduleColRef
          .where('doctorUid', '==', doctorUid)
          .where('monthId', '>=', monthQuery)
          .get();
        const scheduleList = snapshot.docs.map(
          (doc) => doc.data() as MonthlyWorkScheduleSchema
        );
        scheduleList.map((schedule) => {
          schedule.workSlotList.map((workSLot) => {
            if (
              workSLot.recurringId ===
              scheduleData.workSlotList[foundIndex].recurringId
            )
              workSLot.timeRange = timeRange;
          });
        });
        Promise.all(
          scheduleList.map((schedule) => {
            t.update(
              this.getDoctorScheduleDocRef(doctorUid, schedule.monthId),
              schedule
            );
          })
        );
      } else {
        t.update(scheduleDocRef, scheduleData);
      }
    });
  }

  async deleteSchedule(
    dto: MonthlyWorkScheduleDeleteDto,
    doctorUid: string,
    scheduleId: string
  ): Promise<void> {
    await getFirestore().runTransaction(async (t) => {
      const { monthId, updateRelated } = dto;
      const scheduleDocRef = this.getDoctorScheduleDocRef(doctorUid, monthId);
      const scheduleSnapshot = await t.get(scheduleDocRef);
      const scheduleData = scheduleSnapshot.data() as MonthlyWorkScheduleSchema;
      if (!scheduleData)
        throw new CustomServerError({
          message: 'doctor/not-found-schedule',
        });
      const foundIndex = scheduleData.workSlotList.findIndex(
        (workSlot) => workSlot.id == scheduleId
      );
      if (foundIndex === -1)
        throw new CustomServerError({
          message: 'doctor/not-found-schedule',
        });
      const recurringId = scheduleData.workSlotList[foundIndex].recurringId;
      scheduleData.workSlotList.splice(foundIndex, 1);

      if (updateRelated) {
        const scheduleColRef = this.getDoctorScheduleColRef();
        const year = monthId.substring(0, 4);
        const yearReplace = Number(year) - 2;
        const monthQuery = yearReplace + monthId.substring(4);
        // TODO: add field recurringIdList in document to replace this query
        const snapshot = await scheduleColRef
          .where('doctorUid', '==', doctorUid)
          .where('monthId', '>=', monthQuery)
          .get();
        const scheduleList = snapshot.docs.map(
          (doc) => doc.data() as MonthlyWorkScheduleSchema
        );
        scheduleList.map((schedule) => {
          const newWorkSlotList: WorkSlot[] = [];
          schedule.workSlotList.map((workSLot) => {
            if (workSLot.recurringId !== recurringId)
              newWorkSlotList.push(workSLot);
          });
          schedule.workSlotList = newWorkSlotList;
        });
        Promise.all(
          scheduleList.map((schedule) => {
            t.update(
              this.getDoctorScheduleDocRef(doctorUid, schedule.monthId),
              schedule
            );
          })
        );
      } else {
        t.update(scheduleDocRef, scheduleData);
      }
    });
  }

  async addSharingPatientUidToWorkSchedule(args: {
    doctorUid: string;
    patientUid: string;
  }): Promise<void> {
    await getFirestore().runTransaction(async (t) => {
      const { doctorUid, patientUid } = args;
      const monthId = formatDateToMonthId(new Date());
      const scheduleColRef = this.getDoctorScheduleColRef();
      const snapshot = await scheduleColRef
        .where('doctorUid', '==', doctorUid)
        .where('monthId', '>=', monthId)
        .get();
      const scheduleList = snapshot.docs.map(
        (doc) => doc.data() as MonthlyWorkScheduleSchema
      );
      if (scheduleList.length === 0) return;
      Promise.all(
        scheduleList.map((schedule) => {
          const sharingToPatientUidListField: keyof MonthlyWorkScheduleSchema =
            'sharingToPatientUidList';
          t.update(this.getDoctorScheduleDocRef(doctorUid, schedule.monthId), {
            [sharingToPatientUidListField]: FieldValue.arrayUnion(patientUid),
          });
        })
      );
    });
  }
}
