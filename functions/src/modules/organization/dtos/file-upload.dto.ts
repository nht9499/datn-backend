import { IsBase64, IsNumber, IsOptional, IsString } from 'class-validator';

export class FileUploadDto {
  @IsBase64()
  base64: string;

  @IsString()
  name: string;

  @IsNumber()
  size: number;

  @IsOptional()
  isTemplate?: boolean;
}
