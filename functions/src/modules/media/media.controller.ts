import { Body, Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import {
  AppFirebaseUser,
  AppFirebaseUserWithoutRoleDto,
} from '../../decorators/app-firebase-user.decorator';
import { CustomErrorFilter } from '../../filters/custom-exception.filter';
import { AuthGuard } from '../../guards/auth.guard';
import { ImageUploadDto } from './dtos/image-upload.dto';
import { MediaService } from './media.service';

@Controller('media')
@UseFilters(CustomErrorFilter)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(AuthGuard)
  @Post('upload-image')
  async uploadImage(
    @AppFirebaseUser({ useRole: false }) user: AppFirebaseUserWithoutRoleDto,
    @Body() dto: ImageUploadDto
  ): Promise<{ imageUrl: string }> {
    const imageUrl = await this.mediaService.uploadImage(user.uid, dto);
    return { imageUrl };
  }
}
