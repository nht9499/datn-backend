import { CanActivate, ExecutionContext, mixin, Type } from "@nestjs/common";
import { Request } from "express";
import { AuthRole } from "src/constants/enum.constant";
import { CustomServerError } from "../exceptions/custom-server.exception";
import { decodeFirebaseTokenFromRequest } from "../utils/firebase-auth.util";
import { logError } from "../utils/logger.util";

export const AuthRoleGuard = (...roleList: AuthRole[]): Type<CanActivate> => {
  class RoleGuardMixin implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      return await this.validateRequest(request);
    }

    // Validate using custom claims
    private async validateRequest(request: Request): Promise<boolean> {
      try {
        const decodedIdToken = await decodeFirebaseTokenFromRequest(request);

        // TODO validate role
        decodedIdToken.uid;

        return true;
      } catch (error) {
        logError(request.url, "Unauthorized");
        throw new CustomServerError({ message: "auth/unauthorized" });
      }
    }
  }

  const guard = mixin(RoleGuardMixin);
  return guard;
};
