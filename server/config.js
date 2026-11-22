export const config = {
  port: Number(process.env.PORT) || 3001,
  appUrl: process.env.APP_URL || "",
  adminEmail: process.env.ADMIN_EMAIL || "cyberdemons121@gmail.com",
  smtpUser: process.env.SMTP_EMAIL || "",
  smtpAppPassword: process.env.SMTP_APP_PASSWORD || "",
  fromEmail:
    process.env.FROM_EMAIL ||
    process.env.SMTP_EMAIL ||
    "cyberdemons121@gmail.com",
  sheetId: process.env.GOOGLE_SHEET_ID || "",
  serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
  privateKey: process.env.GOOGLE_PRIVATE_KEY || "",
  sessionSecret: process.env.SESSION_SECRET || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
};

export function missingEnv(keys) {
  return keys.filter((key) => !config[key]);
}
