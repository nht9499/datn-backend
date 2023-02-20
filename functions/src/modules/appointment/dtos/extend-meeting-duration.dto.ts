import { IsNumber } from 'class-validator';

export class ExtendMeetingDurationDto {
  @IsNumber()
  durationInMinutes: number;
}
