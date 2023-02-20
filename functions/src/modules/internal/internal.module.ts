import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { InternalController } from './internal.controller';

@Module({
  imports: [SharedModule],
  controllers: [InternalController],
  providers: [],
  exports: [],
})
export class InternalModule {}
