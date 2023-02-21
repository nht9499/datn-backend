import { Module } from '@nestjs/common';
import { InternalModule } from './modules/internal/internal.module';
import { SharedModule } from './modules/shared/shared.module';
import { MediaModule } from './modules/media/media.module';
import { UserModule } from './modules/user/user.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { SimilarModule } from './modules/similar/similar.module';

@Module({
  imports: [
    SharedModule,
    InternalModule,
    MediaModule,
    UserModule,
    OrganizationModule,
    SimilarModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
