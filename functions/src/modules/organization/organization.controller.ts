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
import { OrganizationWriteDto } from './dtos/organization-write.dto';
import { OrganizationService } from './organization.service';
import fs from 'fs';
import { FileUploadDto } from './dtos/file-upload.dto';
import { generateNanoid } from '../../utils/random.util';

@Controller('organizations')
@UseFilters(CustomErrorFilter)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // @UseGuards(AuthGuard)
  @Post('/')
  async createOrganization(
    @AppFirebaseUser({ useRole: false }) user: AppFirebaseUserWithoutRoleDto,
    @Body() dto: OrganizationWriteDto
  ): Promise<void> {
    await this.organizationService.createOrganization(user.token.uid, dto);
  }

  // @UseGuards(AuthRoleGuard('patient'))
  @Post('/:organizationUid/add-member/:userUid')
  async addMember(
    // @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('organizationUid') organizationUid: string,
    @Param('userUid') userUid: string
  ): Promise<void> {
    return await this.organizationService.addMember({
      userUid,
      organizationUid,
    });
  }
  @Post('/:organizationUid/add-member-by-email')
  async addMemberByEmail(
    // @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('organizationUid') organizationUid: string,
    @Body()
    dto: {
      email: string;
    }
  ): Promise<void> {
    return await this.organizationService.addMemberByEmail({
      email: dto.email,
      organizationUid,
    });
  }
  @Post('/:organizationUid/remove-member/:userUid')
  async removeMember(
    // @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('organizationUid') organizationUid: string,
    @Param('userUid') userUid: string
  ): Promise<void> {
    return await this.organizationService.removeMember({
      userUid,
      organizationUid,
    });
  }
  // @UseGuards(AuthRoleGuard('patient'))
  @Post('/:organizationUid/add-admin/:userUid')
  async addAdmin(
    @Param('organizationUid') organizationUid: string,
    @Param('userUid') userUid: string
  ): Promise<void> {
    return await this.organizationService.addAdmin({
      userUid,
      organizationUid,
    });
  }
  @Post('/:organizationUid/add-admin-by-email')
  async addAdminByEmail(
    // @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('organizationUid') organizationUid: string,
    @Body()
    dto: {
      email: string;
    }
  ): Promise<void> {
    return await this.organizationService.addAdminByEmail({
      email: dto.email,
      organizationUid,
    });
  }
  @Post('/:organizationUid/remove-admin/:userUid')
  async removeAdmin(
    // @AppFirebaseUser() user: AppFirebaseUserDto,
    @Param('organizationUid') organizationUid: string,
    @Param('userUid') userUid: string
  ): Promise<void> {
    return await this.organizationService.removeAdmin({
      userUid,
      organizationUid,
    });
  }

  @Post('/:organizationUid/upload')
  async upload(
    @Param('organizationUid') organizationUid: string,
    @Body() dto: FileUploadDto
  ): Promise<string> {
    return this.organizationService.uploadFile(
      dto,
      organizationUid,
      dto.isTemplate ?? false
    );
  }

  @Post('/:organizationUid/file-remove/:fileUid')
  async removeFile(
    @Param('organizationUid') organizationUid: string,
    @Param('fileUid') fileUid: string
  ): Promise<void> {
    return this.organizationService.removeFile(organizationUid, fileUid);
  }

  @Post('/:organizationUid/file-share')
  async shareFileSystem(
    @Param('organizationUid') organizationUid: string,
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
    return this.organizationService.shareFileSystem({
      organizationUid,
      file: dto,
    });
  }
}
