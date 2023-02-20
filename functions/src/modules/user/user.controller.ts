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
import { FileUploadDto } from './dtos/file-upload.dto';
import { UserWriteDto } from './dtos/user-write.dto';
import { UserService } from './user.service';

@Controller('users')
@UseFilters(CustomErrorFilter)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @UseGuards(AuthGuard)
  @Post('/')
  async registerProfile(
    @AppFirebaseUser({ useRole: false }) user: AppFirebaseUserWithoutRoleDto,
    @Body() dto: UserWriteDto
  ): Promise<void> {
    await this.userService.registerUser(user.token.uid, dto);
  }

  // @UseGuards(AuthRoleGuard('patient'))
  @Post('/join-organization/:organizationUid')
  async joinOrganization(
    @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('organizationUid') organizationUid: string
  ): Promise<void> {
    return await this.userService.joinOrganization({
      userUid: user.uid,
      organizationUid,
    });
  }

  @Post('/upload')
  async upload(
    @AppFirebaseUser() user: AppFirebaseUserDto,
    @Body() dto: FileUploadDto
  ): Promise<string> {
    return this.userService.uploadFile(dto, user.uid, dto.isTemplate ?? false);
  }

  @Post('/:userUid/file-remove/:fileUid')
  async removeFile(
    @Param('userUid') userUid: string,
    @Param('fileUid') fileUid: string
  ): Promise<void> {
    return this.userService.removeFile(userUid, fileUid);
  }

  @Post('/:userUid/file-share')
  async shareFileSystem(
    @Param('userUid') userUid: string,
    @Body()
    dto: {
      uid: string;
      name: string;
      url: string;
      size: number;
      status: string;
      sharedToSystem: boolean;
    }
  ): Promise<void> {
    return this.userService.shareFileSystem({
      userUid,
      file: dto,
    });
  }
}
