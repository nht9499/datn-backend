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
      numberOfKeyword?: number;
      numberOfResult?: number;
      sendEmail: boolean;
    }
  ): Promise<void> {
    const {
      testList,
      organizationUid,
      type,
      numberOfKeyword,
      numberOfResult,
      sendEmail,
    } = dto;
    const payload = {
      userUid: user.token.uid,
      organizationUid,
      testList: testList,
      type,
      numberOfKeyword: 3,
      numberOfResult: 1,
      sendEmail,
    };
    if (type === 'internet') payload.numberOfKeyword = numberOfKeyword ?? 3;
    payload.numberOfResult = numberOfResult ?? 3;
    this.similarService.executeTest(payload);
    return;
  }
}
