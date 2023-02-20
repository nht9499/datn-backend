import { Injectable } from '@nestjs/common';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_ORGANIZATIONS } from '../../../constants/firestore.constant';
import { OrganizationSchema } from '../../organization/schemas/organization.schema';

@Injectable()
export class OrganizationRepository {
  async createOrganization(schema: OrganizationSchema) {
    await getFirestore()
      .collection(COLLECTION_ORGANIZATIONS.name)
      .doc(schema.uid)
      .create(schema);
  }

  async getOrganization(
    organizationUid: string
  ): Promise<OrganizationSchema | null> {
    const docSnapshot = await getFirestore()
      .collection(COLLECTION_ORGANIZATIONS.name)
      .doc(organizationUid)
      .get();

    return (docSnapshot.data() as OrganizationSchema | undefined) ?? null;
  }

  async updateOrganization(
    organizationUid: string,
    fieldsToUpdate: Partial<Record<keyof OrganizationSchema, any>>
  ): Promise<void> {
    await getFirestore()
      .collection(COLLECTION_ORGANIZATIONS.name)
      .doc(organizationUid)
      .update(fieldsToUpdate);
  }

  async addUserToOrganization(args: {
    organizationUid: string;
    userUid: string;
  }): Promise<void> {
    const { organizationUid, userUid } = args;

    await this.updateOrganization(organizationUid, {
      memberUidList: FieldValue.arrayUnion(userUid),
    });
  }

  async removeUserFromOrganization(args: {
    organizationUid: string;
    userUid: string;
  }): Promise<void> {
    const { organizationUid, userUid } = args;

    await this.updateOrganization(organizationUid, {
      memberUidList: FieldValue.arrayRemove(userUid),
    });
  }

  async addAdmin(args: {
    organizationUid: string;
    userUid: string;
  }): Promise<void> {
    const { organizationUid, userUid } = args;

    await this.updateOrganization(organizationUid, {
      memberUidList: FieldValue.arrayUnion(userUid),
      adminUidList: FieldValue.arrayUnion(userUid),
    });
  }

  async removeAdmin(args: {
    organizationUid: string;
    userUid: string;
  }): Promise<void> {
    const { organizationUid, userUid } = args;

    await this.updateOrganization(organizationUid, {
      // memberUidList: FieldValue.arrayRemove(userUid),
      adminUidList: FieldValue.arrayRemove(userUid),
    });
  }

  async addFile(args: {
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
    const { organizationUid, file } = args;

    await this.updateOrganization(organizationUid, {
      data: FieldValue.arrayUnion(file),
    });
  }

  async removeFile(args: {
    organizationUid: string;
    fileUid: string;
  }): Promise<void> {
    const { organizationUid, fileUid } = args;
    const organization = await this.getOrganization(organizationUid);
    if (!organization) return;
    const foundIndex = organization.data.findIndex(
      (fileData) => fileUid === fileData.uid
    );
    if (foundIndex !== -1) {
      organization.data.splice(foundIndex, 1);
    }
    await this.updateOrganization(organizationUid, {
      data: organization.data,
    });
  }

  async shareFileToSystem(args: {
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
    const { organizationUid, file } = args;
    const user = await this.getOrganization(organizationUid);
    if (!user) return;
    const foundIndex = user.data.findIndex(
      (fileData) => file.uid === fileData.uid
    );
    if (foundIndex === -1) {
      return;
    }
    user.data[foundIndex].sharedToSystem = true;
    await this.updateOrganization(organizationUid, {
      data: user.data,
    });

    await this.updateOrganization('mock-staff-uid', {
      data: FieldValue.arrayUnion(file),
    });
  }
}
