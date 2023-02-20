import { Injectable } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { PatientStatus } from '../../constants/enum.constant';
import { CustomFirebaseError } from '../../exceptions/custom-firebase.exception';
import { CustomServerError } from '../../exceptions/custom-server.exception';
import { timestampFromIsoString } from '../../utils/date.util';
import { logError } from '../../utils/logger.util';
import { DoctorDto } from '../doctor/dtos/doctor.dto';
import { AuthRepository } from '../shared/repositories/auth.repository';
import { DoctorRepository } from '../shared/repositories/doctor.repository';
import { PatientDoctorConnectionRepository } from '../shared/repositories/patient-doctor-connection.repository';
import { PatientRepository } from '../shared/repositories/patient.repository';
import {
  checkPatientSnapshotNeedChange,
  parseDoctorSnapshot,
  parsePatientSnapshot,
  PatientDoctorConnectionSchema,
} from '../shared/schemas/patient-doctor-connection.schema';
import { PatientWriteDto } from './dtos/patient-write.dto';
import { DoctorWorkScheduleRepository } from '../shared/repositories/doctor-work-schedule.repository';
import { DoctorOccupationRepository } from '../shared/repositories/doctor-monthly-occupation.repository';
import { PrivateNoteDto } from './dtos/private-note.dto';

@Injectable()
export class PatientService {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly authRepository: AuthRepository,
    private readonly doctorRepository: DoctorRepository,
    private readonly patientDoctorConnectionRepository: PatientDoctorConnectionRepository,
    private readonly doctorWorkScheduleRepository: DoctorWorkScheduleRepository,
    private readonly doctorOccupationRepository: DoctorOccupationRepository
  ) {}

  async registerPatient(uid: string, dto: PatientWriteDto): Promise<void> {
    const userRecord = await getAuth().getUser(uid);

    if (userRecord.phoneNumber == null) {
      // Unexpected
      logError(
        'Patient register',
        `Patient ${uid} does not have a phone number`
      );
      throw new CustomFirebaseError('auth/no-phone-number');
    }

    const schemaToCreate = PatientWriteDto.toSchemaCreate({
      uid,
      phoneNumber: userRecord.phoneNumber,
      dto,
    });

    await Promise.all([
      this.patientRepository.createPatient(schemaToCreate),
      this.authRepository.addRoleToCustomClaims(uid, 'patient'),
    ]);
  }

  async updatePatient(uid: string, dto: PatientWriteDto): Promise<void> {
    const patient = await this.patientRepository.getPatient(uid);

    if (patient == null) {
      throw new CustomServerError({ message: 'patient/not-found' });
    }

    const fieldsToUpdate = PatientWriteDto.toSchemaUpdate(dto);
    await this.patientRepository.updatePatient(uid, fieldsToUpdate);

    // Check if need to update the patient snapshots in this patient's connections
    const needChangeSnapshot = checkPatientSnapshotNeedChange(dto, patient);

    if (needChangeSnapshot) {
      this.patientDoctorConnectionRepository.updatePatientSnapshotForAllPatientConnections(
        uid,
        parsePatientSnapshot({
          uid,
          status: patient.status,
          avatarImageUrl: dto.avatarImageUrl,
          fullName: dto.fullName,
          dob: timestampFromIsoString(dto.dob),
          gender: dto.gender,
        })
      );
    }
  }

  async updatePatientStatus(
    uid: string,
    newStatus: PatientStatus
  ): Promise<void> {
    const patient = await this.patientRepository.getPatient(uid);

    if (patient == null) {
      throw new CustomServerError({ message: 'patient/not-found' });
    }

    await this.patientRepository.updatePatient(uid, {
      status: newStatus,
    });

    await this.patientDoctorConnectionRepository.updatePatientSnapshotForAllPatientConnections(
      patient.uid,
      { ...parsePatientSnapshot(patient), status: newStatus }
    );
  }

  async connectWithDoctor(args: {
    patientUid: string;
    doctorUid: string;
  }): Promise<DoctorDto> {
    const { patientUid, doctorUid } = args;

    const existingConnection =
      await this.patientDoctorConnectionRepository.getConnectionByPatientAndDoctor(
        {
          patientUid,
          doctorUid,
        }
      );

    if (existingConnection != null) {
      throw new CustomServerError({
        message: 'patient/doctor-already-connected',
      });
    }

    const [foundDoctor, foundPatient] = await Promise.all([
      this.doctorRepository.getDoctor(doctorUid),
      this.patientRepository.getPatient(patientUid),
    ]);

    if (foundDoctor == null) {
      throw new CustomServerError({
        message: 'doctor/not-found',
      });
    }

    if (foundPatient == null) {
      throw new CustomServerError({
        message: 'patient/not-found',
      });
    }

    const nowTimestamp = Timestamp.now();

    const schemaToCreate: PatientDoctorConnectionSchema = {
      id: `${patientUid}---${doctorUid}`,
      createdAt: nowTimestamp,
      patientUid,
      doctorUid,
      recentAppointmentSnapshot: null,
      sortOrderForPatient: 999,
      sortOrderForDoctor: 999,
      lastReadAtPatient: nowTimestamp,
      lastReadAtDoctor: nowTimestamp,
      patientSnapshot: parsePatientSnapshot(foundPatient),
      doctorSnapshot: parseDoctorSnapshot(foundDoctor),
    };

    await Promise.all([
      this.patientDoctorConnectionRepository.createConnection(schemaToCreate),
      this.patientRepository.addSharingDoctorUidToPatient({
        patientUid,
        doctorUid,
      }),
      this.doctorRepository.addSharingPatientUidToDoctor({
        doctorUid,
        patientUid,
      }),
      this.doctorWorkScheduleRepository.addSharingPatientUidToWorkSchedule({
        doctorUid,
        patientUid,
      }),
      this.doctorOccupationRepository.addSharingPatientUidToOccupation({
        doctorUid,
        patientUid,
      }),
    ]);

    return DoctorDto.fromSchema(foundDoctor);
  }

  async markConnectionAsRead(args: {
    connectionId: string;
    patientUid: string;
  }): Promise<void> {
    const { connectionId, patientUid } = args;

    const connection =
      await this.patientDoctorConnectionRepository.getConnectionById(
        connectionId
      );

    if (connection == null) {
      throw new CustomServerError({
        message: 'connection/not-found',
      });
    }

    if (connection.patientUid !== patientUid) {
      throw new CustomServerError({
        message: 'auth/unauthorized',
      });
    }

    await this.patientDoctorConnectionRepository.markAsReadRecentAppointment(
      connection.id,
      'patient'
    );
  }

  async createPrivateNote(
    doctorId: string,
    patientId: string,
    dto: PrivateNoteDto
  ): Promise<void> {
    const connectionId = `${patientId}---${doctorId}`;
    await this.patientDoctorConnectionRepository.createPrivateNote({
      connectionId,
      doctorUid: doctorId,
      note: dto.note,
    });
  }

  async updatePrivateNote(
    doctorId: string,
    privateNoteId: string,
    patientId: string,
    dto: PrivateNoteDto
  ): Promise<void> {
    const connectionId = `${patientId}---${doctorId}`;
    await this.patientDoctorConnectionRepository.updatePrivateNote({
      connectionId,
      privateNoteId,
      note: dto.note,
    });
  }

  async deletePrivateNote(
    doctorId: string,
    privateNoteId: string,
    patientId: string
  ): Promise<void> {
    const connectionId = `${patientId}---${doctorId}`;
    await this.patientDoctorConnectionRepository.deletePrivateNote({
      connectionId,
      privateNoteId,
    });
  }

  // async createMockRecentAppointment(): Promise<void> {
  //   const appointmentSnapshotSchema: RecentAppointmentSnapshot = {
  //     appointmentId: uuidv4(),
  //     status: '',
  //   };
  // }
}
