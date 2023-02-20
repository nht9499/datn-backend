import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseFilters,
  UseGuards
} from '@nestjs/common';
import {
  AppFirebaseUser,
  AppFirebaseUserWithoutRoleDto
} from '../../decorators/app-firebase-user.decorator';
import { CustomErrorFilter } from '../../filters/custom-exception.filter';
import { AuthGuard } from '../../guards/auth.guard';
import { UpdateDeviceDataDto } from './dtos/device-write.dto';
import { DeviceService } from './device.service';

@Controller('notifications')
@UseFilters(CustomErrorFilter)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @UseGuards(AuthGuard)
  @Patch('update-device-data')
  async addOrUpdateDeviceData(
    @AppFirebaseUser() user: AppFirebaseUserWithoutRoleDto,
    @Body() dto: UpdateDeviceDataDto
  ): Promise<void> {
    await this.deviceService.addOrUpdateDeviceData(user.uid, dto);
  }

  @UseGuards(AuthGuard)
  @Delete('remove-device-data/:deviceId')
  async removeDeviceData(
    @AppFirebaseUser() user: AppFirebaseUserWithoutRoleDto,
    @Param('deviceId') deviceId: string
  ): Promise<void> {
    await this.deviceService.removeDeviceData(user.uid, deviceId);
  }
}
