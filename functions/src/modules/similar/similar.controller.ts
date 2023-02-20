import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  AppFirebaseUser,
  AppFirebaseUserDto,
  AppFirebaseUserWithoutRoleDto,
} from '../../decorators/app-firebase-user.decorator';
import { CustomErrorFilter } from '../../filters/custom-exception.filter';
import { AuthRoleGuard } from '../../guards/auth-role.guard';
import { AuthGuard } from '../../guards/auth.guard';
import { DoctorDto } from '../doctor/dtos/doctor.dto';
import { SimilarService } from './similar.service';

@Controller('tests')
@UseFilters(CustomErrorFilter)
export class SimilarController {
  constructor(private readonly similarService: SimilarService) {}

  // @UseGuards(AuthGuard)
  @Post('/')
  async executeTest(
    @AppFirebaseUser({ useRole: false }) user: AppFirebaseUserWithoutRoleDto,
    @Body()
    dto: {
      testList: [];
      organizationUid: string | null;
      type: string;
    }
  ): Promise<void> {
    const { testList, organizationUid, type } = dto;
    const payload = {
      userUid: user.token.uid,
      organizationUid,
      testList: testList,
      type,
    };
    await this.similarService.executeTest(payload);
  }
}
