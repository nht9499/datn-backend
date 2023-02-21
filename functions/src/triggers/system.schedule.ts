import { appRegion } from '../app.config';
import { region } from 'firebase-functions';

export const checkSystemPeriodically = async () => {};

export const staleSystemsCheck = region(appRegion)
  .runWith({
    minInstances: 1,
    memory: '128MB',
  })
  .pubsub.schedule('every 1 minutes')
  .onRun(checkSystemPeriodically);

export const monthlySystemCheck = region(appRegion)
  .runWith({
    minInstances: 1,
    memory: '128MB',
  })
  .pubsub.schedule('00 9 1 * *')
  .onRun(async () => {});
