import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  AppFirebaseUser,
  AppFirebaseUserDto,
  AppFirebaseUserWithoutRoleDto,
} from '../../decorators/app-firebase-user.decorator';
import { CustomErrorFilter } from '../../filters/custom-exception.filter';
import { AuthRoleGuard } from '../../guards/auth-role.guard';
import { AuthGuard } from '../../guards/auth.guard';
import { DoctorDto } from '../doctor/dtos/doctor.dto';
import { PatientUpdateStatusDto } from './dtos/patient-update-status.dto';
import { PatientWriteDto } from './dtos/patient-write.dto';
import { PrivateNoteDto } from './dtos/private-note.dto';
import { PatientService } from './patient.service';

@Controller('patients')
@UseFilters(CustomErrorFilter)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @UseGuards(AuthGuard)
  @Post('/register')
  async registerProfile(
    @AppFirebaseUser({ useRole: false }) user: AppFirebaseUserWithoutRoleDto,
    @Body() dto: PatientWriteDto
  ): Promise<void> {
    await this.patientService.registerPatient(user.token.uid, dto);
  }

  @UseGuards(AuthRoleGuard('patient'))
  @Patch()
  async updateProfile(
    @AppFirebaseUser() user: AppFirebaseUserDto,
    @Body() dto: PatientWriteDto
  ): Promise<void> {
    await this.patientService.updatePatient(user.uid, dto);
  }

  @UseGuards(AuthRoleGuard('staff'))
  @Patch('/:patientUid/update-status')
  async updatePatientStatus(
    @Param('patientUid') patientUid: string,
    @Body() dto: PatientUpdateStatusDto
  ): Promise<void> {
    await this.patientService.updatePatientStatus(patientUid, dto.status);
  }

  @UseGuards(AuthRoleGuard('patient'))
  @Post('/connect-with-doctor/:doctorUid')
  async connectWithDoctor(
    @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('doctorUid') doctorUid: string
  ): Promise<DoctorDto> {
    return await this.patientService.connectWithDoctor({
      patientUid: user.uid,
      doctorUid,
    });
  }

  @UseGuards(AuthRoleGuard('patient'))
  @Patch('/mark-connection-as-read/:connectionId')
  async markConnectionAsRead(
    @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('connectionId') connectionId: string
  ): Promise<void> {
    await this.patientService.markConnectionAsRead({
      connectionId,
      patientUid: user.uid,
    });
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Post('/:patientId/private-note')
  async createPrivateNote(
    @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
    @Param('patientId') patientId: string,
    @Body() dto: PrivateNoteDto
  ): Promise<void> {
    await this.patientService.createPrivateNote(doctor.uid, patientId, dto);
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Patch('/:patientId/private-note/:noteId')
  async updatePrivateNote(
    @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
    @Param('patientId') patientId: string,
    @Param('noteId') noteId: string,
    @Body() dto: PrivateNoteDto
  ): Promise<void> {
    await this.patientService.updatePrivateNote(
      doctor.uid,
      noteId,
      patientId,
      dto
    );
  }

  @UseGuards(AuthRoleGuard('doctor'))
  @Delete('/:patientId/private-note/:noteId')
  async deletePrivateNote(
    @AppFirebaseUser() doctor: AppFirebaseUserWithoutRoleDto,
    @Param('patientId') patientId: string,
    @Param('noteId') noteId: string
  ): Promise<void> {
    await this.patientService.deletePrivateNote(doctor.uid, noteId, patientId);
  }
}
