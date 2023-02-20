import { Injectable } from '@nestjs/common';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  AppointmentStatus,
  MessageNotiPatient,
  UserState,
} from '../../constants/enum.constant';
import { CustomServerError } from '../../exceptions/custom-server.exception';
import {
  formatDateToMonthId,
  formatDateToString,
  formatDateToTime,
  timestampFromIsoString,
} from '../../utils/date.util';
import { AuthRepository } from '../shared/repositories/auth.repository';
import { DoctorRepository } from '../shared/repositories/doctor.repository';
import { PatientDoctorConnectionRepository } from '../shared/repositories/patient-doctor-connection.repository';
import { PatientRepository } from '../shared/repositories/patient.repository';
import { RecentAppointmentSnapshot } from '../shared/schemas/patient-doctor-connection.schema';
import {
  AppointmentCreateDto,
  ConfirmByUserDto,
  // EndMeetingByDoctorDto,
  GuidanceDto,
  MedicalFormDto,
  PrivateNoteDto,
  ReviewByDoctorDto,
} from './dtos/appointment-write.dto';
import { AppointmentRepository } from '../shared/repositories/appointment.repository';
import {
  AppointmentEndedRecordSchema,
  PatientConfirmAppointmentRecordSchema,
  PatientRequestAppointmentRecordSchema,
} from '../shared/schemas/patient-medical-record.schema';
import { generateNanoid, generateRandomId } from '../../utils/random.util';
import { AppointmentBookInfo } from './schema/appointment.schema';
import { OccupiedSlot } from '../doctor/schemas/doctor-monthly-occupation.schema';
import { DoctorOccupationRepository } from '../shared/repositories/doctor-monthly-occupation.repository';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { MonthlyIncome } from '../doctor/schemas/doctor-balance-info.schema';
import { DoctorBalanceInfoRepository } from '../shared/repositories/doctor-balance-info.repository';
import { SystemStatisticsByMonthRepository } from '../shared/repositories/system-statistics-by-month.repository';
import { DeviceService } from '../devices/device.service';
import { MessageNotiDoctor } from '../../constants/enum.constant';
import { StatisticsService } from '../statistic/statistic.service';
// import { AccessToken } from 'livekit-server-sdk';
import { getCurrentEnvironmentConfig } from '../../constants/environment';
import { logError } from '../../utils/logger.util';
import { MeetingSchema } from './schema/meeting.schema';
import {
  ScreenShareDataDto,
  UpdateMeetingScreenShareDto,
} from './dtos/update-meeting-screen-share.dto';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly authRepository: AuthRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly patientDoctorConnectionRepository: PatientDoctorConnectionRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly doctorOccupationRepository: DoctorOccupationRepository,
    private readonly doctorBalanceInfoRepository: DoctorBalanceInfoRepository,
    private readonly systemStatisticsByMonthRepository: SystemStatisticsByMonthRepository,
    private readonly deviceService: DeviceService,
    private readonly statisticsService: StatisticsService
  ) {}

  async createAppointment(
    patientUid: string,
    dto: AppointmentCreateDto
  ): Promise<void> {
    const patient = await this.patientRepository.getPatient(patientUid);
    if (!patient)
      throw new CustomServerError({
        message: 'patient/not-found',
      });
    const doctor = await this.doctorRepository.getDoctor(dto.doctorUid);
    if (!doctor)
      throw new CustomServerError({
        message: 'doctor/not-found',
      });
    if (
      !dto.userRequest.descriptionText &&
      !dto.userRequest.descriptionAudioBase64
    )
      throw new CustomServerError({
        message: 'appointment/description-null',
      });
    if (!dto.userRequest.questionText && !dto.userRequest.questionAudioBase64)
      throw new CustomServerError({
        message: 'appointment/question-null',
      });
    const appointmentSchema = await AppointmentCreateDto.toSchemaCreate(
      dto,
      patientUid
    );
    const connectionId = `${patientUid}---${dto.doctorUid}`;
    const recentAppointmentSnapshotSchema: RecentAppointmentSnapshot = {
      appointmentId: appointmentSchema.id,
      updatedAt: appointmentSchema.updatedAt,
      status: appointmentSchema.status,
      userRequest: appointmentSchema.userRequest,
      bookInfo: appointmentSchema.appointmentBookInfo,
    };
    const patientMedicalRecordsSchema: PatientRequestAppointmentRecordSchema = {
      id: generateRandomId(),
      createdAt: appointmentSchema.updatedAt,
      patientId: patientUid,
      doctorId: dto.doctorUid,
      appointmentId: appointmentSchema.id,
      type: 'patientRequestAppointment',
      patientRequestAppointmentRecord: {
        descriptionText: appointmentSchema.userRequest.descriptionText,
        descriptionAudioUrl: appointmentSchema.userRequest.descriptionAudioUrl,
        questionText: appointmentSchema.userRequest.questionText,
        questionAudioUrl: appointmentSchema.userRequest.questionAudioUrl,
        attachmentUrlList: appointmentSchema.userRequest.attachmentUrlList,
      },
    };
    await Promise.all([
      this.appointmentRepository.createAppointment(appointmentSchema),
      this.patientDoctorConnectionRepository.updateConnectionRecentAppointment(
        connectionId,
        recentAppointmentSnapshotSchema,
        'patient'
      ),
      this.patientDoctorConnectionRepository.createPatientMedicalRecord(
        connectionId,
        patientMedicalRecordsSchema
      ),
      this.deviceService.sendPushNotification(dto.doctorUid, {
        title: MessageNotiDoctor.newRequest.title,
        description: MessageNotiDoctor.newRequest.description,
      }),
    ]);
  }

  async reviewByDoctor(
    doctorId: string,
    appointmentId: string,
    dto: ReviewByDoctorDto
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (doctorId !== appointment.doctorUid)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    if (appointment.status !== 'doctorReviewing')
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const status: AppointmentStatus = 'patientConfirming';
    if (dto.isFree) {
      dto.initialFee = 0;
      dto.recurringFee = 0;
    }
    const connectionId = `${appointment.patientUid}---${doctorId}`;
    const now = Timestamp.now();
    const recentAppointmentSnapshotSchema: RecentAppointmentSnapshot = {
      appointmentId: appointmentId,
      updatedAt: now,
      status,
      userRequest: appointment.userRequest,
      bookInfo: appointment.appointmentBookInfo,
    };
    await Promise.all([
      this.appointmentRepository.updateAppointment(appointmentId, {
        appointmentStatus: status,
        fieldToUpdate: 'feeInfo',
        dataFieldToUpdate: {
          createdAt: now,
          isFree: dto.isFree,
          initialFee: dto.initialFee,
          recurringFee: dto.recurringFee,
        },
      }),
      this.patientDoctorConnectionRepository.updateConnectionRecentAppointment(
        connectionId,
        recentAppointmentSnapshotSchema,
        'doctor'
      ),
      this.deviceService.sendPushNotification(appointment.patientUid, {
        title: MessageNotiPatient.adviceAccepted.title,
        description: MessageNotiPatient.adviceAccepted.description,
      }),
    ]);
  }

  async confirmByUser(
    patientId: string,
    appointmentId: string,
    dto: ConfirmByUserDto
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (patientId !== appointment.patientUid)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    if (appointment.status !== 'patientConfirming')
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    // appointment
    const connectionId = `${patientId}---${appointment.doctorUid}`;
    const status: AppointmentStatus = 'beforeMeeting';
    if (!appointment.feeInfo) return;
    const recurringTimes =
      dto.orgDurationInMinutes > 15 ? dto.orgDurationInMinutes / 15 - 1 : 0;
    const finalFee =
      appointment.feeInfo.initialFee +
      appointment.feeInfo.recurringFee * recurringTimes;
    const now = Timestamp.now();
    const appointmentBookInfo: AppointmentBookInfo = {
      createdAt: now,
      finalFee,
      startAt: timestampFromIsoString(dto.startAt),
      orgDurationInMinutes: dto.orgDurationInMinutes,
      // actualDurationInMinutes: null,
    };
    // patientDoctorConnection
    const recentAppointmentSnapshotSchema: RecentAppointmentSnapshot = {
      appointmentId: appointmentId,
      updatedAt: now,
      status,
      userRequest: appointment.userRequest,
      bookInfo: {
        startAt: appointmentBookInfo.startAt,
        orgDurationInMinutes: appointmentBookInfo.orgDurationInMinutes,
      },
    };
    // patientMedicalRecord
    const patientMedicalRecordsSchema: PatientConfirmAppointmentRecordSchema = {
      id: generateRandomId(),
      createdAt: now,
      patientId,
      doctorId: appointment.doctorUid,
      appointmentId,
      type: 'patientConfirmAppointment',
      patientConfirmAppointmentRecord: {
        finalFee: appointmentBookInfo.finalFee,
        startAt: appointmentBookInfo.startAt,
        orgDurationInMinutes: appointmentBookInfo.orgDurationInMinutes,
      },
    };
    // doctorMonthlyOccupation
    const patient = await this.patientRepository.getPatient(patientId);
    if (!patient)
      throw new CustomServerError({
        message: 'patient/not-found',
      });
    const dateTimeStart = new Date(dto.startAt);
    const endTime = new Date(
      dateTimeStart.getTime() + dto.orgDurationInMinutes * 60 * 1000
    );
    const monthId = formatDateToMonthId(dateTimeStart);
    const occupiedSlot: OccupiedSlot = {
      id: generateNanoid(),
      timeZone: 'Asia/Bangkok',
      dateOnly: formatDateToString(dateTimeStart),
      timeRange: {
        startTime: formatDateToTime(dateTimeStart),
        endTime: formatDateToTime(endTime),
      },
      appointmentSnapshot: {
        id: appointmentId,
        finalFee,
        startAt: timestampFromIsoString(dto.startAt),
        orgDurationInMinutes: dto.orgDurationInMinutes,
      },
      patientSnapshot: {
        uid: patientId,
        status: patient.status,
        avatarImageUrl: patient.avatarImageUrl,
        fullName: patient.fullName,
        dob: patient.dob,
        gender: patient.gender,
        searchableKeywordList: patient.searchableKeywordList,
      },
    };

    await Promise.all([
      this.appointmentRepository.updateAppointment(appointmentId, {
        appointmentStatus: status,
        fieldToUpdate: 'appointmentBookInfo',
        dataFieldToUpdate: appointmentBookInfo,
      }),
      this.patientDoctorConnectionRepository.updateConnectionRecentAppointment(
        connectionId,
        recentAppointmentSnapshotSchema,
        'patient'
      ),
      this.patientDoctorConnectionRepository.createPatientMedicalRecord(
        connectionId,
        patientMedicalRecordsSchema
      ),
      this.doctorOccupationRepository.createOrUpdateOccupied(occupiedSlot, {
        doctorUid: appointment.doctorUid,
        monthId,
      }),
      this.statisticsService.logActivePatientDoctor({
        patientUid: appointment.patientUid,
        doctorUid: appointment.doctorUid,
      }),
      this.deviceService.sendPushNotification(appointment.doctorUid, {
        title: MessageNotiDoctor.confirmByUser.title,
        description: !appointment.feeInfo?.isFree
          ? MessageNotiDoctor.paymentByUser.description
          : MessageNotiDoctor.confirmByUser.description,
      }),
    ]);
  }

  async endMeetingByDoctor(
    doctorId: string,
    appointmentId: string
    // dto: EndMeetingByDoctorDto
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (doctorId !== appointment.doctorUid)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    // TODO: remove status beforeMeeting when complete flow
    if (
      appointment.status !== 'duringMeeting' &&
      appointment.status !== 'beforeMeeting'
    )
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    if (!appointment.appointmentBookInfo)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const patient = await this.patientRepository.getPatient(
      appointment.patientUid
    );
    if (!patient)
      throw new CustomServerError({
        message: 'patient/not-found',
      });
    const status: AppointmentStatus = 'doctorConcluding';
    const connectionId = `${appointment.patientUid}---${doctorId}`;
    const now = Timestamp.now();
    // const nowTime = now.toDate().getTime();
    // const startAtTime =
    //   appointment.appointmentBookInfo?.startAt.toDate().getTime() ?? 0;
    // const actualDurationInMinutes = Math.round((nowTime - startAtTime) / 1000 / 60);
    // const appointmentBookInfo: AppointmentBookInfo = {
    //   finalFee: appointment.appointmentBookInfo.finalFee,
    //   startAt: appointment.appointmentBookInfo.startAt,
    //   orgDurationInMinutes:
    //     appointment.appointmentBookInfo.orgDurationInMinutes,
    // actualDurationInMinutes: dto.actualDurationInMinutes,
    // actualDurationInMinutes
    // };
    const recentAppointmentSnapshotSchema: RecentAppointmentSnapshot = {
      appointmentId: appointmentId,
      updatedAt: now,
      status,
      userRequest: appointment.userRequest,
      bookInfo: appointment.appointmentBookInfo,
    };
    // const patientMedicalRecordsSchema: AppointmentEndedRecordSchema = {
    //   id: generateRandomId(),
    //   createdAt: now,
    //   patientId: appointment.patientUid,
    //   doctorId,
    //   appointmentId,
    //   type: 'appointmentEnded',
    // appointmentEndedRecord: {
    // actualDurationInMinutes: dto.actualDurationInMinutes,
    // actualDurationInMinutes
    // },
    // };
    const meetingSchema: MeetingSchema = {
      id: appointment.meeting?.id ?? '',
      patientState: 'left',
      doctorState: 'left',
      extendedDurationInMinutes:
        appointment.meeting?.extendedDurationInMinutes ?? 0,
      endedAt: now,
      screenShareData: null,
    };
    const monthlyIncome: MonthlyIncome = {
      appointmentsTotalFee: appointment.appointmentBookInfo.finalFee,
      appointmentInvoiceList: [
        {
          patientSnapshot: {
            phoneNumber: patient.phoneNumber,
            avatarImageUrl: patient.avatarImageUrl,
            fullName: patient.fullName,
            dob: patient.dob,
            gender: patient.gender,
            email: patient.email,
          },
          appointmentStartAt: appointment.appointmentBookInfo.startAt,
          orgDurationInMinutes:
            appointment.appointmentBookInfo.orgDurationInMinutes,
          // actualDurationInMinutes: dto.actualDurationInMinutes,
          // actualDurationInMinutes,
          appointmentFee: appointment.appointmentBookInfo.finalFee,
        },
      ],
      mauUidList: [appointment.patientUid],
      mauTotalCost: null,
      finalIncome: null,
    };
    await Promise.all([
      // this.appointmentRepository.updateAppointment(appointmentId, {
      //   appointmentStatus: status,
      // fieldToUpdate: 'appointmentBookInfo',
      // dataFieldToUpdate: appointmentBookInfo,
      // }),
      this.appointmentRepository.updateAppointment(appointmentId, {
        appointmentStatus: status,
        fieldToUpdate: 'meeting',
        dataFieldToUpdate: meetingSchema,
      }),
      this.patientDoctorConnectionRepository.updateConnectionRecentAppointment(
        connectionId,
        recentAppointmentSnapshotSchema,
        'doctor'
      ),
      // this.patientDoctorConnectionRepository.createPatientMedicalRecord(
      //   connectionId,
      //   patientMedicalRecordsSchema
      // ),
      this.doctorBalanceInfoRepository.createOrUpdateMonthlyIncomes(
        doctorId,
        monthlyIncome
      ),
    ]);
  }

  async concludeByDoctor(
    doctorId: string,
    appointmentId: string
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (doctorId !== appointment.doctorUid)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    if (appointment.status !== 'doctorConcluding')
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const status: AppointmentStatus = 'done';
    const connectionId = `${appointment.patientUid}---${doctorId}`;
    const now = Timestamp.now();
    const recentAppointmentSnapshotSchema: RecentAppointmentSnapshot = {
      appointmentId: appointmentId,
      updatedAt: now,
      status,
      userRequest: appointment.userRequest,
      bookInfo: appointment.appointmentBookInfo,
    };
    await Promise.all([
      this.appointmentRepository.updateAppointment(appointmentId, {
        appointmentStatus: status,
        fieldToUpdate: null,
        dataFieldToUpdate: null,
      }),
      this.patientDoctorConnectionRepository.updateConnectionRecentAppointment(
        connectionId,
        recentAppointmentSnapshotSchema,
        'doctor'
      ),
    ]);
  }

  // async privateNote(
  //   doctorId: string,
  //   appointmentId: string,
  //   dto: PrivateNoteDto
  // ): Promise<void> {
  //   const appointment = await this.appointmentRepository.getAppointmentById(
  //     appointmentId
  //   );
  //   if (!appointment)
  //     throw new CustomServerError({
  //       message: 'appointment/not-found',
  //     });
  //   if (doctorId !== appointment.doctorUid)
  //     throw new CustomServerError({
  //       message: 'auth/unauthorized',
  //     });
  //   const connectionId = `${appointment.patientUid}---${doctorId}`;
  //   await this.patientDoctorConnectionRepository.createOrUpdatePrivateNoteRecord(
  //     {
  //       patientId: appointment.patientUid,
  //       doctorId,
  //       connectionId,
  //       appointmentId,
  //     },
  //     dto.noteDescription
  //   );
  // }

  async cancelAppointment(
    userUid: string,
    appointmentId: string
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (
      appointment.status !== 'doctorReviewing' &&
      appointment.status !== 'patientConfirming'
    )
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    let promise = [];
    const role = await this.authRepository.getAuthRole(userUid);
    let status: AppointmentStatus = 'patientCanceled';
    let connectionId = `${userUid}---${appointment.doctorUid}`;
    if (role === 'patient') {
      promise.push(
        this.deviceService.sendPushNotification(appointment.doctorUid, {
          title: MessageNotiDoctor.cancel.title,
          description: MessageNotiDoctor.cancel.description,
        })
      );
      if (userUid !== appointment.patientUid)
        throw new CustomServerError({
          message: 'auth/unauthorized',
        });
    } else {
      promise.push(
        this.deviceService.sendPushNotification(appointment.patientUid, {
          title: MessageNotiPatient.cancel.title,
          description: MessageNotiPatient.cancel.description,
        })
      );
      if (userUid !== appointment.doctorUid)
        throw new CustomServerError({
          message: 'auth/unauthorized',
        });
      status = 'doctorCanceled';
      connectionId = `${appointment.patientUid}---${userUid}`;
    }
    const now = Timestamp.now();
    const recentAppointmentSnapshotSchema: RecentAppointmentSnapshot = {
      appointmentId: appointmentId,
      updatedAt: now,
      status,
      userRequest: appointment.userRequest,
      bookInfo: appointment.appointmentBookInfo,
    };
    await Promise.all([
      this.appointmentRepository.updateAppointment(appointmentId, {
        appointmentStatus: status,
        fieldToUpdate: null,
        dataFieldToUpdate: null,
      }),
      this.patientDoctorConnectionRepository.updateConnectionRecentAppointment(
        connectionId,
        recentAppointmentSnapshotSchema,
        role
      ),
      promise,
    ]);
  }

  async createMedicalForm(
    doctorId: string,
    appointmentId: string,
    dto: MedicalFormDto
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (doctorId !== appointment.doctorUid)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const schema = MedicalFormDto.toMedicalFormSchemaCreate(dto);
    await Promise.all([
      this.appointmentRepository.createMedicalForm(appointment, schema),
      this.deviceService.sendPushNotification(appointment.patientUid, {
        title: MessageNotiPatient.requestMedicalForm.title,
        description: MessageNotiPatient.requestMedicalForm.description,
      }),
    ]);
  }

  async updateMedicalForm(
    args: {
      patientId: string;
      appointmentId: string;
      formId: string;
    },
    dto: MedicalFormDto
  ): Promise<void> {
    const { patientId, appointmentId, formId } = args;
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (patientId !== appointment.patientUid)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const schema = MedicalFormDto.toMedicalFormSchemaUpdate(dto, formId);
    const connectionId = `${patientId}---${appointment.doctorUid}`;
    await Promise.all([
      this.appointmentRepository.updateMedicalForm(appointment, schema),
      this.patientDoctorConnectionRepository.createOrUpdateMedicalFormRecord(
        {
          patientId,
          doctorId: appointment.doctorUid,
          connectionId,
          appointmentId,
        },
        schema
      ),
      this.deviceService.sendPushNotification(appointment.doctorUid, {
        title: MessageNotiDoctor.receiveMedicalForm.title,
        description: MessageNotiDoctor.receiveMedicalForm.description,
      }),
    ]);
  }

  async createGuidanceForm(
    doctorId: string,
    appointmentId: string,
    dto: GuidanceDto
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (doctorId !== appointment.doctorUid)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const schema = GuidanceDto.toSchema(dto);
    const connectionId = `${appointment.patientUid}---${doctorId}`;
    await Promise.all([
      this.appointmentRepository.createGuidance(appointment, schema),
      this.patientDoctorConnectionRepository.createOrUpdateGuidanceRecord(
        {
          patientId: appointment.patientUid,
          doctorId,
          connectionId,
          appointmentId,
        },
        schema
      ),
      this.deviceService.sendPushNotification(appointment.patientUid, {
        title: MessageNotiPatient.receiveGuidance.title,
        description: MessageNotiPatient.receiveGuidance.description,
      }),
    ]);
  }

  async generateAgoraToken(userUid: string, appointmentId: string) {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (appointment.status !== 'duringMeeting')
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const userRole = await this.authRepository.getAuthRole(userUid);
    if (userRole === 'doctor') {
      if (userUid !== appointment.doctorUid)
        throw new CustomServerError({
          message: 'auth/unauthorized',
        });
    }
    if (userRole === 'patient') {
      if (userUid !== appointment.patientUid)
        throw new CustomServerError({
          message: 'auth/unauthorized',
        });
    }
    if (!appointment.meeting || appointment.meeting.endedAt)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const appId = process.env.APP_ID ?? '';
    const appCertificate = process.env.APP_CERTIFICATE ?? '';
    const channelName = appointment.meeting.id;
    // const account = userUid;
    // autogen id, will be change to userUid when testing with UI
    const account = 0;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds =
      (appointment.appointmentBookInfo?.orgDurationInMinutes ?? 15) * 60;
    const currentTimestampInSeconds = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs =
      currentTimestampInSeconds + expirationTimeInSeconds;
    return RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      account,
      role,
      privilegeExpiredTs
    );
    // return RtcTokenBuilder.buildTokenWithAccount(
    //   appId,
    //   appCertificate,
    //   channelName,
    //   account,
    //   role,
    //   privilegeExpiredTs
    // );
  }

  async generateLivekitToken(
    userUid: string,
    appointmentId: string
  ): Promise<string> {
    // const appointment = await this.appointmentRepository.getAppointmentById(
    //   appointmentId
    // );

    // if (!appointment) {
    //   throw new CustomServerError({
    //     message: 'appointment/not-found',
    //   });
    // }

    // if (appointment.status !== 'duringMeeting') {
    //   throw new CustomServerError({
    //     message: 'auth/unauthorized',
    //   });
    // }

    // const userRole = await this.authRepository.getAuthRole(userUid);
    // if (userRole === 'doctor') {
    //   if (userUid !== appointment.doctorUid)
    //     throw new CustomServerError({
    //       message: 'auth/unauthorized',
    //     });
    // }

    // if (userRole === 'patient') {
    //   if (userUid !== appointment.patientUid)
    //     throw new CustomServerError({
    //       message: 'auth/unauthorized',
    //     });
    // }

    // if (!appointment.meeting || appointment.meeting.endedAt) {
    //   throw new CustomServerError({
    //     message: 'auth/unauthorized',
    //   });
    // }

    // const envConfig = getCurrentEnvironmentConfig();

    // if (!envConfig.livekitApiKey || !envConfig.livekitSecretKey) {
    //   logError(
    //     'Missing env configs',
    //     'Missing livekitApiKey or livekitSecretKey'
    //   );
    //   throw new CustomServerError({
    //     message: 'server/internal',
    //   });
    // }

    // const accessToken = new AccessToken(
    //   envConfig.livekitApiKey,
    //   envConfig.livekitSecretKey,
    //   {
    //     identity: userUid,
    //   }
    // );

    // accessToken.addGrant({
    //   room: appointment.meeting.id,
    //   roomJoin: true,
    //   // TODO make this false and manage room server-side
    //   roomCreate: true,
    // });

    // return accessToken.toJwt();
    return 'a';
  }

  async updateMeetingState(
    userUid: string,
    appointmentId: string,
    state: UserState
  ) {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment)
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    if (appointment.status !== 'duringMeeting')
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    if (!appointment.meeting || appointment.meeting.endedAt)
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    const userRole = await this.authRepository.getAuthRole(userUid);
    const meetingSchema = appointment.meeting;
    if (userRole === 'doctor') {
      if (userUid !== appointment.doctorUid)
        throw new CustomServerError({
          message: 'auth/unauthorized',
        });
      meetingSchema.doctorState = state;
    }
    if (userRole === 'patient') {
      if (userUid !== appointment.patientUid)
        throw new CustomServerError({
          message: 'auth/unauthorized',
        });
      meetingSchema.patientState = state;
    }
    let promise = [
      // ! this will get bugged if being called multiple times at once (for example, when doctor
      // ! & patient join at the (almost) exact same time)
      // TODO fix
      this.appointmentRepository.updateAppointment(appointment.id, {
        appointmentStatus: appointment.status,
        fieldToUpdate: 'meeting',
        dataFieldToUpdate: meetingSchema,
      }),
    ];
    if (state === 'joined') {
      if (userRole === 'doctor') {
        this.deviceService.sendPushNotification(appointment.patientUid, {
          title: MessageNotiPatient.doctorJoined.title,
          description: MessageNotiPatient.doctorJoined.description,
        });
      } else {
        this.deviceService.sendPushNotification(appointment.doctorUid, {
          title: MessageNotiDoctor.patientJoined.title,
          description: MessageNotiDoctor.patientJoined.title,
        });
      }
    }
    await Promise.all(promise);
  }

  async updateMeetingShareData(
    doctorUid: string,
    appointmentId: string,
    dto: UpdateMeetingScreenShareDto
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment) {
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    }

    if (
      appointment.doctorUid !== doctorUid ||
      appointment.status !== 'duringMeeting' ||
      !appointment.meeting ||
      appointment.meeting.endedAt
    ) {
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    }

    await this.appointmentRepository.updateAppointmentMeeting(appointmentId, {
      'meeting.screenShareData':
        dto.screenShareData == null
          ? null
          : ScreenShareDataDto.toSchema(dto.screenShareData),
    });
  }

  async extendMeetingDuration(
    doctorUid: string,
    appointmentId: string,
    durationInMinutes: number
  ): Promise<void> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId
    );
    if (!appointment) {
      throw new CustomServerError({
        message: 'appointment/not-found',
      });
    }

    if (
      appointment.doctorUid !== doctorUid ||
      appointment.status !== 'duringMeeting' ||
      !appointment.meeting ||
      appointment.meeting.endedAt
    ) {
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    }

    await this.appointmentRepository.updateAppointmentMeeting(appointmentId, {
      'meeting.extendedDurationInMinutes':
        FieldValue.increment(durationInMinutes),
    });
  }

  async checkAndCreateMeetings() {
    const appointmentList =
      await this.appointmentRepository.getBeforeMeetingAppointment();
    appointmentList.map((appointment) => {
      if (appointment.appointmentBookInfo) {
        const now = Timestamp.now();
        const nowTime = now.toDate().getTime();
        const startAtTime = appointment.appointmentBookInfo.startAt
          .toDate()
          .getTime();
        const timeToCreate = startAtTime - 30 * 60 * 1000;
        console.log(timeToCreate, 'a', nowTime);
        if (startAtTime > nowTime && timeToCreate <= nowTime) {
          const status: AppointmentStatus = 'duringMeeting';
          const recentAppointmentSnapshotSchema: RecentAppointmentSnapshot = {
            appointmentId: appointment.id,
            updatedAt: now,
            status,
            userRequest: appointment.userRequest,
            bookInfo: appointment.appointmentBookInfo,
          };
          const meetingSchema: MeetingSchema = {
            id: generateRandomId(),
            patientState: 'pending',
            doctorState: 'pending',
            extendedDurationInMinutes: 0,
            endedAt: null,
            screenShareData: null,
          };
          const connectionId = `${appointment.patientUid}---${appointment.doctorUid}`;
          Promise.all([
            this.appointmentRepository.updateAppointment(appointment.id, {
              appointmentStatus: status,
              fieldToUpdate: 'meeting',
              dataFieldToUpdate: meetingSchema,
            }),
            this.patientDoctorConnectionRepository.updateConnectionRecentAppointment(
              connectionId,
              recentAppointmentSnapshotSchema,
              null
            ),
            this.deviceService.sendPushNotification(appointment.doctorUid, {
              title: MessageNotiDoctor.remindTime.title,
              description: MessageNotiDoctor.remindTime.description,
            }),
            this.deviceService.sendPushNotification(appointment.patientUid, {
              title: MessageNotiPatient.remindTime.title,
              description: MessageNotiPatient.remindTime.description,
            }),
          ]);
        }
      }
    });
  }
}
