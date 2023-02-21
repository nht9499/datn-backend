import { Controller, Param, Post, UseFilters } from '@nestjs/common';
import { CustomServerError } from '../../exceptions/custom-server.exception';
import { CustomErrorFilter } from '../../filters/custom-exception.filter';
import { checkSystemPeriodically } from '../../triggers/system.schedule';

const internalPasskey = 'skgkitor741304';

@Controller('internal')
@UseFilters(CustomErrorFilter)
export class InternalController {
  constructor() {}

  @Post('run-script/:passkey')
  async runScript(@Param('passkey') passkey: string): Promise<void> {
    if (passkey !== internalPasskey) {
      throw new CustomServerError({ message: 'auth/unauthorized' });
    }
  }

  @Post('test-check-system-periodically/:passkey')
  async testCheckSystemPeriodically(
    @Param('passkey') passkey: string
  ): Promise<void> {
    if (passkey !== internalPasskey) {
      throw new CustomServerError({ message: 'auth/unauthorized' });
    }

    await checkSystemPeriodically();
  }
}
