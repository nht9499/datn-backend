import { Injectable } from '@nestjs/common';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { COLLECTION_TEST_RESULTS } from '../../../constants/firestore.constant';
import { SimilarSchema } from '../../similar/schemas/similar.schema';

@Injectable()
export class TestRepository {
  async createTestResult(schema: SimilarSchema) {
    await getFirestore()
      .collection(COLLECTION_TEST_RESULTS.name)
      .doc(schema.uid)
      .create(schema);
  }
}
