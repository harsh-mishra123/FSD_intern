import { CorsOptions } from 'cors';

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

const readAllowedOriginsFromEnv = (): string[] => {
  const envValue = process.env.CLIENT_URL;
  if (!envValue) {
    return [];
  }

  return envValue
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...readAllowedOriginsFromEnv()]));

const buildOriginError = (origin: string): Error => {
  return new Error(`CORS blocked for origin: ${origin}`);
};

export const isOriginAllowed = (origin?: string): boolean => {
  // Allow server-to-server or CLI requests that do not send Origin.
  if (!origin) {
    return true;
  }

  return ALLOWED_ORIGINS.includes(origin);
};

export const expressCorsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(buildOriginError(origin as string));
  },
  credentials: true,
};

export const socketCorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
