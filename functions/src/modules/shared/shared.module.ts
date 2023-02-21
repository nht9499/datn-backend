import { Module } from '@nestjs/common';
import { AuthRepository } from './repositories/auth.repository';
import { EmailService } from '../email/email.service';
import { UserRepository } from './repositories/user.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { TestRepository } from './repositories/test.repository';

@Module({
  imports: [],
  providers: [
    AuthRepository,
    EmailService,
    UserRepository,
    OrganizationRepository,
    TestRepository,
  ],
  exports: [
    AuthRepository,
    EmailService,
    UserRepository,
    OrganizationRepository,
    TestRepository,
  ],
})
export class SharedModule {}
