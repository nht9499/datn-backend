import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { auth } from 'firebase-admin';
import { AuthRole } from 'src/constants/enum.constant';
import { AppCustomClaimsDto } from 'src/modules/shared/dtos/app-custom-claims.dto';
import { CustomServerError } from '../exceptions/custom-server.exception';
import {
  AUTH_ROLE_HEADER,
  decodeFirebaseTokenFromRequest,
} from '../utils/firebase-auth.util';

// Return this if useRole == false
export class AppFirebaseUserWithoutRoleDto {
  token: auth.DecodedIdToken;

  // For convenience
  uid: string;
}

// Return this if useRole == true
export class AppFirebaseUserDto extends AppFirebaseUserWithoutRoleDto {
  role: AuthRole;
}

/** Request's header must have {@link AUTH_ROLE_HEADER}. Otherwise, this will throw exception. */
export const AppFirebaseUser = createParamDecorator(
  async (
    { useRole }: { useRole: boolean } = { useRole: true },
    ctx: ExecutionContext
  ) => {
    const request = ctx.switchToHttp().getRequest();

    try {
      const token = await decodeFirebaseTokenFromRequest(request);

      if (!useRole) {
        const result: AppFirebaseUserWithoutRoleDto = {
          token,
          uid: token.uid,
        };
        return result;
      }

      const roleField: keyof AppCustomClaimsDto = 'role';

      const result: AppFirebaseUserDto = {
        token,
        uid: token.uid,
        role: token[roleField],
      };
      return result;
    } catch (e) {
      throw new CustomServerError({ message: 'auth/unauthorized' });
    }
  }
);
