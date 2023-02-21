import { Change, firestore, region } from 'firebase-functions';
import { appRegion } from '../app.config';
import { COLLECTION_TEST_RESULTS } from '../constants/firestore.constant';

const triggerPath = `${COLLECTION_TEST_RESULTS.name}/{uid}`;
export const onPatientWrite = region(appRegion)
  .runWith({ minInstances: 0, memory: '256MB' })
  .firestore.document(triggerPath)
  .onWrite((change, context) => {});
