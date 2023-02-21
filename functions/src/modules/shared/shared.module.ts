import { Module } from '@nestjs/common';
import { AuthRepository } from './repositories/auth.repository';
import { EmailService } from '../email/email.service';
import { UserRepository } from './repositories/user.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { TestRepository } from './repositories/test.repository';
import { SaleStatisticsByYearRepository } from './repositories/sales-statistics-by-year.repository';

@Module({
  imports: [],
  providers: [
    AuthRepository,
    EmailService,
    UserRepository,
    OrganizationRepository,
    TestRepository,
    SaleStatisticsByYearRepository,
  ],
  exports: [
    AuthRepository,
    EmailService,
    UserRepository,
    OrganizationRepository,
    TestRepository,
    SaleStatisticsByYearRepository,
  ],
})
export class SharedModule {}
