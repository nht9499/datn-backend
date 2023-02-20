import { IsIn } from 'class-validator';
import { UserState, userStateList } from '../../../constants/enum.constant';

export class UpdateMeetingStateDto {
  @IsIn(userStateList)
  state: UserState;
}
