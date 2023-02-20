import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  AppFirebaseUser,
  AppFirebaseUserWithoutRoleDto,
} from '../../decorators/app-firebase-user.decorator';
import { CustomErrorFilter } from '../../filters/custom-exception.filter';
import { AuthRoleGuard } from '../../guards/auth-role.guard';
import { AuthGuard } from '../../guards/auth.guard';
import { AppointmentService } from './appointment.service';
import {
  AppointmentCreateDto,
  ConfirmByUserDto,
  // EndMeetingByDoctorDto,
  GuidanceDto,
  MedicalFormDto,
  ReviewByDoctorDto,
} from './dtos/appointment-write.dto';
import { ExtendMeetingDurationDto } from './dtos/extend-meeting-duration.dto';
import { UpdateMeetingScreenShareDto } from './dtos/update-meeting-screen-share.dto';
import { UpdateMeetingStateDto } from './dtos/update-meeting-state.dto';

@Controller('appointments')
@UseFilters(CustomErrorFilter)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @UseGuards(AuthRoleGuard('patient'))
  @Post('/')
  async createAppointment(
    @AppFirebaseUser() patient: AppFirebaseUserWithoutRoleDto,
    @Body() dto: AppointmentCreateDto
  ): Promise<void> {
    await this.appointmentService.createAppointment(patient.uid, dto);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/:appointmentId/review-by-doctor')
  async reviewByDoctor(
    @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: ReviewByDoctorDto
  ): Promise<void> {
    await this.appointmentService.reviewByDoctor(
      doctor.uid,
      appointmentId,
      dto
    );
  }

  @UseGuards(AuthRoleGuard('patient'))
  @Patch('/:appointmentId/confirm-by-user')
  async confirmByUser(
    @AppFirebaseUser() patient: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: ConfirmByUserDto
  ): Promise<void> {
    await this.appointmentService.confirmByUser(
      patient.uid,
      appointmentId,
      dto
    );
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/:appointmentId/end-meeting-by-doctor')
  async endMeetingByDoctor(
    @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string
    // @Body() dto: EndMeetingByDoctorDto
  ): Promise<void> {
    await this.appointmentService.endMeetingByDoctor(
      doctor.uid,
      appointmentId
      // dto
    );
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/:appointmentId/conclude-by-doctor')
  async concludeByDoctor(
    @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string
  ): Promise<void> {
    await this.appointmentService.concludeByDoctor(doctor.uid, appointmentId);
  }

  // @UseGuards(AuthRoleGuard('doctor'))
  // @Post('/:appointmentId/private-note')
  // async privateNote(
  //   @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
  //   @Param('appointmentId') appointmentId: string,
  //   @Body() dto: PrivateNoteDto
  // ): Promise<void> {
  //   await this.appointmentService.privateNote(doctor.uid, appointmentId, dto);
  // }

  @UseGuards(AuthGuard)
  @Patch('/:appointmentId/cancel')
  async cancelAppointment(
    @AppFirebaseUser() user: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string
  ): Promise<void> {
    await this.appointmentService.cancelAppointment(user.uid, appointmentId);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Post('/:appointmentId/medical-form')
  async createMedicalForm(
    @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: MedicalFormDto
  ): Promise<void> {
    await this.appointmentService.createMedicalForm(
      doctor.uid,
      appointmentId,
      dto
    );
  }

  @UseGuards(AuthRoleGuard('patient'))
  @Patch('/:appointmentId/medical-form/:formId')
  async updateMedicalForm(
    @AppFirebaseUser() patient: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string,
    @Param('formId') formId: string,
    @Body() dto: MedicalFormDto
  ): Promise<void> {
    await this.appointmentService.updateMedicalForm(
      { patientId: patient.uid, appointmentId, formId },
      dto
    );
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Post('/:appointmentId/guidance-form')
  async createGuidanceForm(
    @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: GuidanceDto
  ): Promise<void> {
    await this.appointmentService.createGuidanceForm(
      doctor.uid,
      appointmentId,
      dto
    );
  }

  @UseGuards(AuthRoleGuard('doctor', 'patient'))
  @Get('/:appointmentId/call-room-agora-token')
  async getAgoraToken(
    @AppFirebaseUser() user: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string
  ): Promise<string> {
    return await this.appointmentService.generateAgoraToken(
      user.uid,
      appointmentId
    );
  }

  @UseGuards(AuthRoleGuard('doctor', 'patient'))
  @Get('/:appointmentId/meeting/token')
  async getMeetingToken(
    @AppFirebaseUser() user: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string
  ): Promise<string> {
    return await this.appointmentService.generateLivekitToken(
      user.uid,
      appointmentId
    );
  }

  @UseGuards(AuthRoleGuard('doctor', 'patient'))
  @Patch('/:appointmentId/meeting/update-state')
  async updateMeetingState(
    @AppFirebaseUser() user: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateMeetingStateDto
  ): Promise<void> {
    await this.appointmentService.updateMeetingState(
      user.uid,
      appointmentId,
      dto.state
    );
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/:appointmentId/meeting/screen-share')
  async updateMeetingScreenShare(
    @AppFirebaseUser() user: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateMeetingScreenShareDto
  ): Promise<void> {
    await this.appointmentService.updateMeetingShareData(
      user.uid,
      appointmentId,
      dto
    );
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/:appointmentId/meeting/extend-duration')
  async extendMeetingDuration(
    @AppFirebaseUser() user: AppFirebaseUserWithoutRoleDto,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: ExtendMeetingDurationDto
  ): Promise<void> {
    await this.appointmentService.extendMeetingDuration(
      user.uid,
      appointmentId,
      dto.durationInMinutes
    );
  }
}
