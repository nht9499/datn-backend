import { Type } from 'class-transformer';
import {
  IsBase64,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Timestamp } from 'firebase-admin/firestore';
import { generateRandomId } from '../../../utils/random.util';
import {
  AppointmentSchema,
  GuidanceSchema,
  MedicalFormSchema,
  NoteGuidanceSchema,
  PrescriptionGuidanceSchema,
} from '../schema/appointment.schema';
import {
  medicalFormTypeList,
  MedicalFormType,
  guidanceTypeList,
  GuidanceType,
  guidanceUnitList,
  GuidanceUnit,
} from '../../../constants/enum.constant';
import { uploadAudioToStorage } from '../../../utils/storage.util';

export class UserRequest {
  @IsString()
  @IsOptional()
  descriptionText: string | null;

  @IsBase64()
  @IsOptional()
  descriptionAudioBase64: string | null;

  @IsString()
  @IsOptional()
  questionText: string | null;

  @IsBase64()
  @IsOptional()
  questionAudioBase64: string | null;

  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  attachmentUrlList: string[];
}
export class AppointmentCreateDto {
  @IsString()
  @IsNotEmpty()
  doctorUid: string;

  @ValidateNested()
  @Type(() => UserRequest)
  userRequest: UserRequest;

  static async toSchemaCreate(
    dto: AppointmentCreateDto,
    patientUid: string
  ): Promise<AppointmentSchema> {
    const nowTimestamp = Timestamp.now();

    const appointmentId = generateRandomId();
    const descriptionAudioUrl = dto.userRequest.descriptionAudioBase64
      ? await uploadAudioToStorage({
          appointmentId: appointmentId,
          audioBase64: dto.userRequest.descriptionAudioBase64,
        })
      : null;
    const questionAudioUrl = dto.userRequest.questionAudioBase64
      ? await uploadAudioToStorage({
          appointmentId: appointmentId,
          audioBase64: dto.userRequest.questionAudioBase64,
        })
      : null;
    return {
      id: appointmentId,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
      status: 'doctorReviewing',
      patientUid,
      doctorUid: dto.doctorUid,
      userRequest: {
        createdAt: nowTimestamp,
        descriptionText: dto.userRequest.descriptionText,
        descriptionAudioUrl: descriptionAudioUrl,
        questionText: dto.userRequest.questionText,
        questionAudioUrl: questionAudioUrl,
        attachmentUrlList: dto.userRequest.attachmentUrlList,
      },
      feeInfo: null,
      appointmentBookInfo: null,
    };
  }
}

export class ReviewByDoctorDto {
  @IsBoolean()
  isFree: boolean;

  @IsNumber()
  initialFee: number;

  @IsNumber()
  recurringFee: number;
}

export class ConfirmByUserDto {
  // @IsNumber()
  // finalFee: number;

  @IsISO8601()
  startAt: string;

  @IsNumber()
  orgDurationInMinutes: number;
}

// export class EndMeetingByDoctorDto {
//   @IsNumber()
//   actualDurationInMinutes: number;
// }

export class PrivateNoteDto {
  @IsString()
  noteDescription: string;
}

class MedicalHistoryFormDto {
  @IsNumber()
  @Min(1)
  @Max(300)
  height: number;

  @IsNumber()
  @Min(1)
  @Max(300)
  weight: number;

  @IsString({ each: true })
  medicalHistory: string[];

  @IsString({ each: true })
  subjectiveSigns: string[];

  @IsOptional()
  @IsString()
  allergy: string;

  @IsNumber()
  @Min(0)
  physicalExercises: number;

  @IsNumber()
  @Min(0)
  dietRisk: number;

  @IsNumber()
  @Min(0)
  drinking: number;

  @IsNumber()
  @Min(0)
  smoking: number;

  @IsOptional()
  @IsString()
  note: string;

  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  attachmentUrlList: string[];
}

class VitalSignsFormDto {
  @IsNumber()
  @Min(1)
  @Max(300)
  height: number;

  @IsNumber()
  @Min(1)
  @Max(300)
  weight: number;

  @Min(1)
  @Max(100)
  @IsNumber()
  bodyTemperature: number;

  @Min(1)
  @Max(200)
  @IsNumber()
  heartRate: number;

  @Min(1)
  @Max(100)
  @IsNumber()
  respiration: number;

  @Min(1)
  @Max(100)
  @IsNumber()
  spO2: number;

  @Min(1)
  @Max(300)
  @IsNumber()
  bloodPressureLow: number;

  @Min(1)
  @Max(300)
  @IsNumber()
  bloodPressureHight: number;
}

class TestResultsFormDto {
  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  attachmentUrlList: string[];
}

class CurrentPrescriptionFormDto {
  @IsUrl(
    {
      require_host: false,
    },
    { each: true }
  )
  attachmentUrlList: string[];
}

export class MedicalFormDto {
  @IsIn(medicalFormTypeList)
  type: MedicalFormType;

  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalHistoryFormDto)
  medicalHistoryForm: MedicalHistoryFormDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VitalSignsFormDto)
  vitalSignsForm: VitalSignsFormDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TestResultsFormDto)
  testResultsForm: TestResultsFormDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CurrentPrescriptionFormDto)
  currentPrescriptionForm: CurrentPrescriptionFormDto;

  static toMedicalFormSchemaCreate(dto: MedicalFormDto): MedicalFormSchema {
    if (dto.type === 'medicalHistory')
      return {
        id: generateRandomId(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        type: dto.type,
        medicalHistoryForm: null,
      };
    if (dto.type === 'vitalSigns')
      return {
        id: generateRandomId(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        type: dto.type,
        vitalSignsForm: null,
      };
    if (dto.type === 'testResults')
      return {
        id: generateRandomId(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        type: dto.type,
        testResultsForm: null,
      };
    // current prescription form
    return {
      id: generateRandomId(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      type: dto.type,
      currentPrescriptionForm: null,
    };
  }

  static toMedicalFormSchemaUpdate(
    dto: MedicalFormDto,
    formId: string
  ): MedicalFormSchema {
    if (dto.type === 'medicalHistory') {
      return {
        id: formId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        type: dto.type,
        medicalHistoryForm: {
          height: dto.medicalHistoryForm.height,
          weight: dto.medicalHistoryForm.weight,
          medicalHistory: dto.medicalHistoryForm.medicalHistory,
          subjectiveSigns: dto.medicalHistoryForm.subjectiveSigns,
          allergy: dto.medicalHistoryForm.allergy,
          physicalExercises: dto.medicalHistoryForm.physicalExercises,
          dietRisk: dto.medicalHistoryForm.dietRisk,
          drinking: dto.medicalHistoryForm.drinking,
          smoking: dto.medicalHistoryForm.smoking,
          note: dto.medicalHistoryForm.note,
          attachmentUrlList: dto.medicalHistoryForm.attachmentUrlList,
        },
      };
    }
    if (dto.type === 'vitalSigns')
      return {
        id: formId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        type: dto.type,
        vitalSignsForm: {
          height: dto.vitalSignsForm.height,
          weight: dto.vitalSignsForm.weight,
          bodyTemperature: dto.vitalSignsForm.bodyTemperature,
          heartRate: dto.vitalSignsForm.heartRate,
          respiration: dto.vitalSignsForm.respiration,
          spO2: dto.vitalSignsForm.spO2,
          bloodPressureLow: dto.vitalSignsForm.bloodPressureLow,
          bloodPressureHight: dto.vitalSignsForm.bloodPressureHight,
        },
      };
    if (dto.type === 'testResults')
      return {
        id: formId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        type: dto.type,
        testResultsForm: {
          attachmentUrlList: dto.testResultsForm.attachmentUrlList,
        },
      };
    // current prescription form
    return {
      id: formId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      type: dto.type,
      currentPrescriptionForm: {
        attachmentUrlList: dto.currentPrescriptionForm.attachmentUrlList,
      },
    };
  }
}

class PrescriptionGuidance {
  @ValidateNested({ each: true })
  @Type(() => Medicine)
  medicineList: Medicine[];

  @IsString()
  @ValidateIf((object, value) => value !== null)
  note: string | null;
}
class Medicine {
  @IsString()
  name: string;

  @IsNumber()
  totalAmount: number;

  @IsIn(guidanceUnitList)
  unit: GuidanceUnit;

  @IsNumber()
  amountInUnitsPerTime: number;

  @IsNumber()
  timesPerDay: number;

  @ValidateIf((object, value) => value !== null)
  @IsString()
  medicineNote: string | null;
}
class GuidanceNote {
  @ValidateIf((object, value) => value !== null)
  @IsString()
  note: string | null;
}

export class GuidanceDto {
  @IsIn(guidanceTypeList)
  type: GuidanceType;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrescriptionGuidance)
  prescriptionGuidance?: PrescriptionGuidance;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuidanceNote)
  noteGuidance?: GuidanceNote;

  static toSchema(dto: GuidanceDto): GuidanceSchema {
    const noteGuidanceDto = dto as NoteGuidanceSchema;
    const prescriptionGuidanceDto = dto as PrescriptionGuidanceSchema;
    if (dto.type === 'note')
      return {
        id: generateRandomId(),
        createdAt: Timestamp.now(),
        type: dto.type,
        noteGuidance: {
          note: noteGuidanceDto.noteGuidance.note,
        },
      };
    return {
      id: generateRandomId(),
      createdAt: Timestamp.now(),
      type: dto.type,
      prescriptionGuidance: {
        medicineList: prescriptionGuidanceDto.prescriptionGuidance.medicineList,
        note: prescriptionGuidanceDto.prescriptionGuidance.note,
      },
    };
  }
}
