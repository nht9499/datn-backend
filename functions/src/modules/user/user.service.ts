import { Injectable } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { PatientStatus } from '../../constants/enum.constant';
import { CustomServerError } from '../../exceptions/custom-server.exception';
import { generateNanoid } from '../../utils/random.util';
import { AuthRepository } from '../shared/repositories/auth.repository';
import { OrganizationRepository } from '../shared/repositories/organization.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { FileUploadDto } from './dtos/file-upload.dto';
import { UserWriteDto } from './dtos/user-write.dto';
import fs from 'fs';
import { formatDateToMonthId } from '../../utils/date.util';
import { SaleStatisticsByYearRepository } from '../shared/repositories/sales-statistics-by-year.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly saleStatisticsByYearRepository: SaleStatisticsByYearRepository
  ) {}

  async registerUser(uid: string, dto: UserWriteDto): Promise<void> {
    // const userRecord = await getAuth().getUser(uid);

    const schemaToCreate = UserWriteDto.toSchemaCreate({
      uid,
      dto,
    });

    const user = await this.userRepository.getUser(schemaToCreate.uid);
    if (user) return;

    await Promise.all([
      this.saleStatisticsByYearRepository.updateStatistics({
        monthId: formatDateToMonthId(new Date()),
        fileCount: 0,
        newUserCount: 1,
        testCount: 0,
      }),
      this.userRepository.createUser(schemaToCreate),
      this.authRepository.addRoleToCustomClaims(uid, 'user'),
    ]);
    return;
  }
  async createStaff(uid: string, dto: UserWriteDto): Promise<void> {
    // const userRecord = await getAuth().getUser(uid);

    const schemaToCreate = UserWriteDto.toSchemaCreate({
      uid,
      dto,
    });

    const user = await this.userRepository.getUser(schemaToCreate.uid);
    if (user) return;

    await Promise.all([
      this.userRepository.createUser(schemaToCreate),
      this.authRepository.addRoleToCustomClaims(uid, 'staff'),
    ]);
  }

  async updateUserStatus(uid: string, newStatus: PatientStatus): Promise<void> {
    const user = await this.userRepository.getUser(uid);

    if (user == null) {
      throw new CustomServerError({ message: 'patient/not-found' });
    }

    await this.userRepository.updateUser(uid, {
      status: newStatus,
    });
  }

  async joinOrganization(args: { userUid: string; organizationUid: string }) {
    const { userUid, organizationUid } = args;

    const [foundOrganization, foundUser] = await Promise.all([
      this.organizationRepository.getOrganization(organizationUid),
      this.userRepository.getUser(userUid),
    ]);

    if (foundOrganization == null) {
      throw new CustomServerError({
        message: 'doctor/not-found',
      });
    }

    if (foundUser == null) {
      throw new CustomServerError({
        message: 'patient/not-found',
      });
    }

    await Promise.all([
      this.userRepository.addOrganizationToUser({
        userUid,
        organization: {
          uid: foundOrganization.uid,
          name: foundOrganization.fullName,
          email: foundOrganization.email ?? null,
          status: 'activated',
        },
      }),
      this.organizationRepository.addUserToOrganization({
        organizationUid,
        userUid,
        userEmail: foundUser.email ?? null,
      }),
    ]);
  }

  async uploadFile(
    dto: FileUploadDto,
    userUid: string,
    isTemplate: boolean
  ): Promise<string> {
    const random = generateNanoid();
    const file = Buffer.from(dto.base64, 'base64');
    // const filePath = `D:\\DATN\\userupload\\${random}-${dto.name}`;
    const filePath = `D:/DATN/userupload/${random}---${dto.name}`;
    fs.writeFile(filePath, file, (err) => {
      if (err) throw err;
    });
    if (isTemplate) {
      this.userRepository.addFile({
        userUid,
        file: {
          uid: generateNanoid(),
          name: dto.name,
          url: filePath,
          size: dto.size,
          status: 'activated',
          sharedToSystem: false,
        },
      });
    }
    await this.saleStatisticsByYearRepository.updateStatistics({
      monthId: formatDateToMonthId(new Date()),
      fileCount: 1,
      newUserCount: 0,
      testCount: 0,
    });
    return filePath;
  }

  async removeFile(userUid: string, fileUid: string): Promise<void> {
    await this.userRepository.removeFile({ userUid, fileUid });
  }

  async shareFileSystem(args: {
    userUid: string;
    file: {
      uid: string;
      name: string;
      url: string;
      size: number;
      status: string;
      sharedToSystem: boolean;
    };
  }): Promise<void> {
    args.file.sharedToSystem = true;
    await this.userRepository.shareFileToSystem(args);
  }
}
