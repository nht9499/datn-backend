export enum Environment {
  local = 'local',
  stag = 'stag',
  prod = 'prod',
}

export interface EnvironmentConfig {
  livekitApiKey: string | undefined;
  livekitSecretKey: string | undefined;
}

export const environmentConfigMap: Record<Environment, EnvironmentConfig> = {
  [Environment.local]: {
    livekitApiKey: process.env.LIVEKIT_API_KEY,
    livekitSecretKey: process.env.LIVEKIT_SECRET_KEY,
  },
  [Environment.stag]: {
    livekitApiKey: process.env.LIVEKIT_API_KEY,
    livekitSecretKey: process.env.LIVEKIT_SECRET_KEY,
  },
  [Environment.prod]: {
    livekitApiKey: process.env.LIVEKIT_API_KEY,
    livekitSecretKey: process.env.LIVEKIT_SECRET_KEY,
  },
};

export const getCurrentEnvironment = (): Environment => {
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    return Environment.local;
  }

  switch (process.env.MY_ENV) {
    case 'local':
      return Environment.local;
    case 'stag':
      return Environment.stag;
    case 'prod':
      return Environment.prod;
    default:
      throw new Error('Environment not set');
  }
};

export const getCurrentEnvironmentConfig = (): EnvironmentConfig => {
  return environmentConfigMap[getCurrentEnvironment()];
};
