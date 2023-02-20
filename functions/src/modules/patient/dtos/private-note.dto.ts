import { IsString } from 'class-validator';

export class PrivateNoteDto {
  @IsString()
  note: string;
}
