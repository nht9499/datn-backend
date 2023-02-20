import { Injectable } from '@nestjs/common';
import { getAuth } from 'firebase-admin/auth';
import { PatientStatus } from '../../constants/enum.constant';
import { CustomServerError } from '../../exceptions/custom-server.exception';
import { UserRepository } from '../shared/repositories/user.repository';
import { OrganizationRepository } from '../shared/repositories/organization.repository';
import { TestRepository } from '../shared/repositories/test.repository';
import { EmailService } from '../email/email.service';
import { generateNanoid } from '../../utils/random.util';
import { formatDateToString } from '../../utils/date.util';
import axios from 'axios';
import fs from 'fs';
import { SimilarSchema } from './schemas/similar.schema';
import { Timestamp } from 'firebase-admin/firestore';

@Injectable()
export class SimilarService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly testRepository: TestRepository,
    private readonly emailService: EmailService
  ) {}

  async executeTest(args: {
    userUid: string;
    organizationUid: string | null;
    testList: string[];
    type: string;
  }): Promise<void> {
    const { userUid, organizationUid, testList, type } = args;
    const now = Timestamp.now();
    let count = 0;
    let templateList: string[] = [];
    const user = await this.userRepository.getUser(userUid);
    if (!user) return;
    if (type === 'own') {
      templateList = user.data.map((file) => file.url);
    } else if (type === 'organization' && organizationUid) {
      const organization = await this.organizationRepository.getOrganization(
        organizationUid
      );
      if (!organization) return;
      templateList = organization.data.map((file) => file.url);
    } else if (type === 'system') {
      const system = await this.userRepository.getUser('mock-staff-uid');
      if (!system) return;
      templateList = system.data.map((file) => file.url);
    }
    testList.map(async (test) => {
      let res: any = {};
      if (type === 'internet') {
        const payload = {
          user: userUid,
          testFile: test,
          number_of_keyword: 3,
          number_of_result: 1,
        };
        res = await axios.post(
          'http://127.0.0.1:8000/api/search_on_internet/',
          payload
        );
      } else {
        const payload = {
          user: userUid,
          testFile: test,
          templateFile: templateList,
        };
        res = await axios.post(
          'http://127.0.0.1:8000/api/compute_create/',
          payload
        );
      }
      if (!res.data)
        throw new CustomServerError({ message: 'server/internal' });
      // const baseDir = '/Users/tamnguyen/Downloads';
      const baseDir = `D:/DATN/datn-web-app/public`;
      const testFilePath = `${baseDir}/${generateNanoid()}.json`;
      const templateFilePath = `${baseDir}/${generateNanoid()}.json`;
      fs.writeFile(testFilePath, JSON.stringify(res.data.testFile), (err) => {
        if (err) throw err;
      });
      fs.writeFile(
        templateFilePath,
        JSON.stringify(res.data.templateFile),
        (err) => {
          if (err) throw err;
        }
      );
      const schema: SimilarSchema = {
        uid: generateNanoid(),
        createdAt: now,
        updatedAt: now,
        userUid,
        organizationSnapshot: null,
        dataTestUrl: testFilePath,
        dataTemplateUrl: templateFilePath,
        status: 'done',
        matchPercent: res.data.matchPercent ?? 0,
      };
      await this.testRepository.createTestResult(schema);
      if (count === testList.length - 1) {
        await this.emailService.sendEmail({
          to: user.email ?? 'nht9499@gmail.com',
          subject: `Kết quả kiểm tra tương đồng ${formatDateToString(
            new Date()
          )}`,
          html: 'Kết quả kiểm tra của bạn đã sẵn sàng hãy click <a href="http://localhost:3001/history" style="text-decoration: none;"> vào đây</a> để xem',
        });
      }
      count++;
    });
  }
}
