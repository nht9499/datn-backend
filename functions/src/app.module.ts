import { Module } from '@nestjs/common';
import { InternalModule } from './modules/internal/internal.module';
import { PatientModule } from './modules/patient/patient.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SharedModule } from './modules/shared/shared.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { MediaModule } from './modules/media/media.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { DeviceModule } from './modules/devices/device.module';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { SimilarModule } from './modules/similar/similar.module';

@Module({
  imports: [
    SharedModule,
    SettingsModule,
    InternalModule,
    PatientModule,
    DoctorModule,
    MediaModule,
    AppointmentModule,
    DeviceModule,
    UserModule,
    OrganizationModule,
    SimilarModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
