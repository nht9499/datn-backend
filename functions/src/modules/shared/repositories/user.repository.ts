import { Injectable } from '@nestjs/common';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_USERS } from '../../../constants/firestore.constant';
import { UserSchema } from '../../user/schemas/user.schema';

@Injectable()
export class UserRepository {
  async createUser(schema: UserSchema) {
    await getFirestore()
      .collection(COLLECTION_USERS.name)
      .doc(schema.uid)
      .create(schema);
  }

  async getUser(userUid: string): Promise<UserSchema | null> {
    const docSnapshot = await getFirestore()
      .collection(COLLECTION_USERS.name)
      .doc(userUid)
      .get();

    return (docSnapshot.data() as UserSchema | undefined) ?? null;
  }

  async updateUser(
    userUid: string,
    fieldsToUpdate: Partial<Record<keyof UserSchema, any>>
  ): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_USERS.name)
      .doc(userUid)
      .update(fieldsToUpdate);
  }

  async addOrganizationToUser(args: {
    userUid: string;
    organization: {
      uid: string;
      name: string;
      email: string | null;
      status: string;
    };
  }): Promise<void> {
    const { userUid, organization } = args;
    const OrganizationSnapshotSchema = {
      uid: organization.uid,
      name: organization.name,
      email: organization.email,
      status: organization.status,
      isAdmin: false,
    };
    await this.updateUser(userUid, {
      organizationList: FieldValue.arrayUnion(OrganizationSnapshotSchema),
    });
  }
  async addOrganizationToUserAdmin(args: {
    userUid: string;
    organization: {
      uid: string;
      name: string;
    };
  }): Promise<void> {
    const { userUid, organization } = args;
    const OrganizationSnapshotSchema = {
      uid: organization.uid,
      name: organization.name,
      isAdmin: true,
    };
    await this.updateUser(userUid, {
      organizationList: FieldValue.arrayUnion(OrganizationSnapshotSchema),
    });
  }

  async removeOrganizationFromUser(args: {
    userUid: string;
    organization: {
      uid: string;
      name: string;
    };
  }): Promise<void> {
    const { userUid, organization } = args;

    const user = await this.getUser(userUid);
    if (!user) return;
    const foundIndex = user.organizationList.findIndex(
      (org) => organization.uid === org.uid
    );
    if (foundIndex !== -1) {
      user.organizationList.splice(foundIndex, 1);
    }
    await this.updateUser(userUid, {
      organizationList: user.organizationList,
    });
  }
  async removeAdminRole(args: {
    userUid: string;
    organization: {
      uid: string;
      name: string;
    };
  }): Promise<void> {
    const { userUid, organization } = args;

    const user = await this.getUser(userUid);
    if (!user) return;
    const foundIndex = user.organizationList.findIndex(
      (org) => organization.uid === org.uid
    );
    if (foundIndex !== -1) {
      user.organizationList[foundIndex].isAdmin = false;
    }
    await this.updateUser(userUid, {
      organizationList: user.organizationList,
    });
  }

  async addFile(args: {
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
    const { userUid, file } = args;

    await this.updateUser(userUid, {
      data: FieldValue.arrayUnion(file),
    });
  }

  async removeFile(args: { userUid: string; fileUid: string }): Promise<void> {
    const { userUid, fileUid } = args;
    const user = await this.getUser(userUid);
    if (!user) return;
    const foundIndex = user.data.findIndex(
      (fileData) => fileUid === fileData.uid
    );
    if (foundIndex !== -1) {
      user.data.splice(foundIndex, 1);
    }
    await this.updateUser(userUid, {
      data: user.data,
    });
  }

  async shareFileToSystem(args: {
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
    const { userUid, file } = args;
    const user = await this.getUser(userUid);
    if (!user) return;
    const foundIndex = user.data.findIndex(
      (fileData) => file.uid === fileData.uid
    );
    if (foundIndex === -1) {
      return;
    }
    user.data[foundIndex].sharedToSystem = true;
    await this.updateUser(userUid, {
      data: user.data,
    });

    await this.updateUser('mock-staff-uid', {
      data: FieldValue.arrayUnion(file),
    });
  }
}
