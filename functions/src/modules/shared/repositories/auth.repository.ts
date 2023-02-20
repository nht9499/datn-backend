import { Injectable } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { AuthRole } from '../../../constants/enum.constant';
import { AppCustomClaimsDto } from '../dtos/app-custom-claims.dto';

@Injectable()
export class AuthRepository {
  async addRoleToCustomClaims(uid: string, authRole: AuthRole): Promise<void> {
    const userRecord = await getAuth().getUser(uid);

    const oldCustomClaims = userRecord.customClaims as
      | AppCustomClaimsDto
      | undefined;

    const customClaims: AppCustomClaimsDto = {
      ...(oldCustomClaims ?? {}),
      role: authRole,
    };

    await getAuth().setCustomUserClaims(uid, customClaims);
  }

  async getAuthRole(uid: string): Promise<AuthRole> {
    const user = await getAuth().getUser(uid);
    return user.customClaims?.role ?? null;
  }

  async getAuthInfo(uid: string): Promise<any> {
    const customClaims: AppCustomClaimsDto = {
      role: 'staff',
    };
    await getAuth().setCustomUserClaims(uid, customClaims);
    const user = await getAuth().getUser(uid);
    return user;
  }
}
