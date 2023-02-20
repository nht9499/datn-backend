import { Injectable } from '@nestjs/common';
import { SettingsRepository } from '../shared/repositories/settings.repository';
import { SettingsWriteDto } from './dtos/settings-write.dto';
import { VersionSettingsSchema } from './schemas/version-settings.schema';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async setSettings(dto: SettingsWriteDto): Promise<void> {
    const schema = SettingsWriteDto.toSchema(dto);

    await this.settingsRepository.setSettings(schema);
  }

  /** For mock purpose only */
  async initVersionSettings(): Promise<void> {
    const schema: VersionSettingsSchema = {
      id: 'versionSettings',
      minAppVersionDriverAndroid: '0.0.1',
      minAppVersionDriverIos: '0.0.1',
      minAppVersionUserAndroid: '0.0.1',
      minAppVersionUserIos: '0.0.1',
    };

    await this.settingsRepository.setVersionSettings(schema);
  }
}
