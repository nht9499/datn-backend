import { Injectable } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { PatientStatus } from '../../constants/enum.constant';
import { CustomServerError } from '../../exceptions/custom-server.exception';
import { DoctorDto } from '../doctor/dtos/doctor.dto';
import { AuthRepository } from '../shared/repositories/auth.repository';
import { OrganizationRepository } from '../shared/repositories/organization.repository';
import { UserRepository } from '../shared/repositories/user.repository';
import { FileUploadDto } from './dtos/file-upload.dto';
import { OrganizationWriteDto } from './dtos/organization-write.dto';
import { generateNanoid } from '../../utils/random.util';
import fs from 'fs';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
    private readonly organizationRepository: OrganizationRepository
  ) {}

  async createOrganization(
    userUid: string,
    dto: OrganizationWriteDto
  ): Promise<void> {
    // const userRecord = await getAuth().getUser(uid);
    const user = await this.userRepository.getUser(userUid);

    const schemaToCreate = OrganizationWriteDto.toSchemaCreate({
      userUid,
      userEmail: user?.email ?? null,
      dto,
    });

    await Promise.all([
      this.organizationRepository.createOrganization(schemaToCreate),
      this.userRepository.addOrganizationToUserAdmin({
        userUid,
        organization: {
          uid: schemaToCreate.uid,
          name: schemaToCreate.fullName,
        },
      }),
    ]);
  }

  async addMember(args: { userUid: string; organizationUid: string }) {
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

  async removeMember(args: { userUid: string; organizationUid: string }) {
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
      this.userRepository.removeOrganizationFromUser({
        userUid,
        organization: {
          uid: foundOrganization.uid,
          name: foundOrganization.fullName,
        },
      }),
      this.organizationRepository.removeUserFromOrganization({
        organizationUid,
        userUid,
      }),
    ]);
  }

  async addAdmin(args: { userUid: string; organizationUid: string }) {
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
      this.userRepository.addOrganizationToUserAdmin({
        userUid,
        organization: {
          uid: foundOrganization.uid,
          name: foundOrganization.fullName,
        },
      }),
      this.organizationRepository.addAdmin({
        organizationUid,
        userUid,
        userEmail: foundUser.email ?? null,
      }),
    ]);
  }

  async removeAdmin(args: { userUid: string; organizationUid: string }) {
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
      this.userRepository.removeAdminRole({
        userUid,
        organization: {
          uid: foundOrganization.uid,
          name: foundOrganization.fullName,
        },
      }),
      this.organizationRepository.removeAdmin({
        organizationUid,
        userUid,
      }),
    ]);
  }

  async uploadFile(
    dto: FileUploadDto,
    organizationUid: string,
    isTemplate: boolean
  ): Promise<string> {
    const random = generateNanoid();
    const file = Buffer.from(dto.base64, 'base64');
    // const filePath = `D:\\DATN\\userupload\\${random}-${dto.name}`;
    const filePath = `D:/DATN/userupload/${random}---${dto.name}`;
    fs.writeFile(filePath, file, (err) => {
      if (err) throw err;
    });
    console.log(filePath);
    if (isTemplate) {
      this.organizationRepository.addFile({
        organizationUid,
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
    return filePath;
  }

  async removeFile(organizationUid: string, fileUid: string): Promise<void> {
    await this.organizationRepository.removeFile({ organizationUid, fileUid });
  }

  async shareFileSystem(args: {
    organizationUid: string;
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
    await this.organizationRepository.shareFileToSystem(args);
  }
}
