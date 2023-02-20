import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { EmailService } from './email.service';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
