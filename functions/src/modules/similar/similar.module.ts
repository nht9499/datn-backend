import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { SimilarController } from './similar.controller';
import { SimilarService } from './similar.service';

@Module({
  imports: [SharedModule],
  controllers: [SimilarController],
  providers: [SimilarService],
  exports: [SimilarService],
})
export class SimilarModule {}
