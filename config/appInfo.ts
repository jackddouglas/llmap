const port = process.env.APP_PORT || 4000;
const apiBasePath = "/api/auth/";

export const websiteDomain = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`;

export const appInfo = {
  appName: "LLMap",
  websiteDomain,
  apiDomain: websiteDomain,
  apiBasePath,
};
