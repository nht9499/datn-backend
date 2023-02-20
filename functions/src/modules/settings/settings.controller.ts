import { Body, Controller, Put, UseFilters, UseGuards } from '@nestjs/common';
import { CustomErrorFilter } from '../../filters/custom-exception.filter';
import { AuthRoleGuard } from '../../guards/auth-role.guard';
import { SettingsWriteDto } from './dtos/settings-write.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseFilters(CustomErrorFilter)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Put()
  @UseGuards(AuthRoleGuard('staff'))
  async setSettings(@Body() dto: SettingsWriteDto): Promise<void> {
    return await this.settingsService.setSettings(dto);
  }
}
