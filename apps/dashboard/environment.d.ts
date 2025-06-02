import "next";
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      SESSION_SECRET: string;
      JWT_EXPIRE: string;
      COOKIE_EXPIRE: string;
      IS_PRODUCTION: string;
      BASE_API_URL_PROD: string;
      BASE_API_URL_DEV: string;
      BASE_SOCKET_URL_PROD: string;
      BASE_SOCKET_URL_DEV: string;
    }
  }
}
