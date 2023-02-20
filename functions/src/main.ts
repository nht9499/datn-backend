import { config as configDotEnv } from 'dotenv';

configDotEnv();

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import express from 'express';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './filters/custom-exception.filter';
import { initMock } from './mock/init-mock';
import { CustomValidationPipe } from './pipes/custom-validation.pipe';
import { onDoctorWrite, onPatientWrite } from './triggers/auth.trigger';
import {
  monthlySystemCheck,
  staleSystemsCheck,
} from './triggers/system.schedule';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import { region } from 'firebase-functions';
import { appRegion } from './app.config';
import { HandlerTimeLoggerInterceptor } from './interceptors/handler-time-logger.interceptor';

// * ===== Plugin stuff

dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

// * ===== NestJS stuff

const server = express();

const createNestServer = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  app.enableCors({
    origin: [
      'https://hybrid-dbs.web.app',
      /(hybrid-dbs).*/,
      'https://shipper-phuquoc.sk-global.biz',
      'https://shipperphuquoc.vn',
      'http://localhost:3001/',
      /(localhost).*/,
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalInterceptors(new HandlerTimeLoggerInterceptor());

  // * Init app
  await app.init();
};

// * ===== Firebase stuff

initializeApp();
// ! Firestore previously will throw error if there is undefined field(s)
// !  this will tell Firestore to ignore it and not put it in a document
getFirestore().settings({ ignoreUndefinedProperties: true });

// * ===== Export functions & triggers

export const api = region(appRegion)
  .runWith({ minInstances: 1, memory: '1GB' })
  .https.onRequest(async (...args) => {
    await createNestServer();
    server(...args);
  });

export { staleSystemsCheck, monthlySystemCheck, onDoctorWrite, onPatientWrite };
// * ===== MOCK

const isEmulator =
  process.env.FUNCTIONS_EMULATOR === 'true' &&
  process.env.FIRESTORE_EMULATOR_HOST != null &&
  process.env.FIREBASE_AUTH_EMULATOR_HOST != null;

if (isEmulator) {
  // .then() To avoid lint error @typescript-eslint/no-floating-promises
  initMock().then(() => console.log('Finish mocking data'));
}
