import { Injectable } from '@nestjs/common';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { AppointmentStatus } from '../../../constants/enum.constant';
import { COLLECTION_APPOINTMENTS } from '../../../constants/firestore.constant';
import { CustomServerError } from '../../../exceptions/custom-server.exception';
import {
  AppointmentBookInfo,
  AppointmentSchema,
  FeeInfo,
  GuidanceSchema,
  MedicalFormSchema,
} from '../../appointment/schema/appointment.schema';
import { MeetingSchema } from '../../appointment/schema/meeting.schema';

@Injectable()
export class AppointmentRepository {
  async getAppointmentById(
    appointmentId: string
  ): Promise<AppointmentSchema | null> {
    const appointment = await getFirestore()
      .collection(COLLECTION_APPOINTMENTS.name)
      .doc(appointmentId)
      .get();
    return (appointment.data() as AppointmentSchema | undefined) ?? null;
  }

  async createAppointment(schema: AppointmentSchema): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_APPOINTMENTS.name)
      .doc(schema.id)
      .set(schema);
  }

  async updateAppointment(
    appointmentId: string,
    args: {
      appointmentStatus: AppointmentStatus;
      fieldToUpdate: keyof AppointmentSchema | null;
      dataFieldToUpdate: FeeInfo | AppointmentBookInfo | MeetingSchema | null;
    }
  ): Promise<void> {
    const { appointmentStatus, fieldToUpdate, dataFieldToUpdate } = args;
    const updatedAt: keyof AppointmentSchema = 'updatedAt';
    const status: keyof AppointmentSchema = 'status';

    await getFirestore()
      .collection(COLLECTION_APPOINTMENTS.name)
      .doc(appointmentId)
      .update({
        [updatedAt]: Timestamp.now(),
        [status]: appointmentStatus,
        ...(fieldToUpdate && { [fieldToUpdate]: dataFieldToUpdate }),
      });
  }

  async updateAppointmentMeeting(
    appointmentId: string,
    fieldsToUpdate: Partial<Record<`meeting.${keyof MeetingSchema}`, any>>
  ): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_APPOINTMENTS.name)
      .doc(appointmentId)
      .update(fieldsToUpdate);
  }

  async createMedicalForm(
    appointment: AppointmentSchema,
    formSchema: MedicalFormSchema
  ): Promise<void> {
    if (!appointment.medicalFormList) {
      appointment.medicalFormList = [formSchema];
    } else {
      appointment.medicalFormList.push(formSchema);
    }
    await getFirestore()
      .collection(COLLECTION_APPOINTMENTS.name)
      .doc(appointment.id)
      .set(appointment);
  }

  async updateMedicalForm(
    appointment: AppointmentSchema,
    formSchema: MedicalFormSchema
  ): Promise<void> {
    if (
      !appointment.medicalFormList ||
      appointment.medicalFormList.length < 0
    ) {
      throw new CustomServerError({
        message: 'appointment/not-found-form',
      });
    } else {
      const foundIndex = appointment.medicalFormList.findIndex(
        (medicalForm) => medicalForm.id == formSchema.id
      );
      if (foundIndex === -1)
        throw new CustomServerError({
          message: 'appointment/not-found-form',
        });
      appointment.medicalFormList[foundIndex] = formSchema;
      const medicalFormList: keyof AppointmentSchema = 'medicalFormList';
      await getFirestore()
        .collection(COLLECTION_APPOINTMENTS.name)
        .doc(appointment.id)
        .update({
          [medicalFormList]: appointment.medicalFormList,
        });
    }
  }

  async createGuidance(
    appointment: AppointmentSchema,
    schema: GuidanceSchema
  ): Promise<void> {
    if (!appointment.guidanceList) {
      appointment.guidanceList = [schema];
    } else {
      appointment.guidanceList.push(schema);
    }
    await getFirestore()
      .collection(COLLECTION_APPOINTMENTS.name)
      .doc(appointment.id)
      .set(appointment);
  }

  async getBeforeMeetingAppointment(): Promise<AppointmentSchema[]> {
    const statusField: keyof AppointmentSchema = 'status';
    const beforeMeeting: AppointmentStatus = 'beforeMeeting';

    const querySnapshot = await getFirestore()
      .collection(COLLECTION_APPOINTMENTS.name)
      .where(statusField, '==', beforeMeeting)
      .get();
    return querySnapshot.docs.map(
      (docSnapshot) => docSnapshot.data() as AppointmentSchema
    );
  }
}
